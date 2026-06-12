import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ArrowLeft, UploadSimple, X, Trash, FilePdf, FileXls, FileDoc, FileText, DownloadSimple, ArrowsClockwise } from "phosphor-react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabaseClient";

import {
  fetchDriveFilesByFolder,
  saveDriveFile,
  deleteDriveFile,
  DriveFileRow,
} from "@/lib/helpers/drive/driveFilesAPI";
import { useUser } from "@/utils/context/UserContext";
import DeleteFileModal from "./DeleteFileModal";

type FolderFilesModalProps = {
  open: boolean;
  onClose: () => void;
  folderName: string;
  driveFolderId: number | null;
  collegeId: number | null;
  onFilesChanged?: (
    driveFolderId: number,
    fileCount: number,
    totalSizeBytes: number,
  ) => void;
};

type UploadItem = {
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
};

function formatSize(bytes: number | null): string {
  if (!bytes || bytes === 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getFileIcon(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return <FilePdf size={22} color="#E44D26" weight="fill" />;
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return <FileXls size={22} color="#1D6F42" weight="fill" />;
  if (name.endsWith(".doc") || name.endsWith(".docx")) return <FileDoc size={22} color="#2B579A" weight="fill" />;
  return <FileText size={22} color="#6B7280" weight="fill" />;
}

export default function FolderFilesModal({
  open,
  onClose,
  folderName,
  driveFolderId,
  collegeId,
  onFilesChanged,
}: FolderFilesModalProps) {
  const t = (key: string) => undefined;
  const { userId } = useUser();

  const [files, setFiles] = useState<DriveFileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingFileId, setReplacingFileId] = useState<number | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);

  const totalSizeBytes = files.reduce((acc, f) => acc + (f.fileSize ?? 0), 0);

  useEffect(() => {
    if (!open || !driveFolderId) {
      setFiles([]);
      setLoading(false);
      setSelectedFileIds([]);
      return;
    }
    setLoading(true);
    fetchDriveFilesByFolder(driveFolderId)
      .then((data) => {
        const fetched = data as DriveFileRow[];
        setFiles(fetched);
        const totalBytes = fetched.reduce(
          (acc, f) => acc + (f.fileSize ?? 0),
          0,
        );
        onFilesChanged?.(driveFolderId, fetched.length, totalBytes);
      })
      .catch(() => Toast.show({ type: "error", text1: "Failed to load files" }))
      .finally(() => setLoading(false));
  }, [open, driveFolderId]);

  useEffect(() => {
    if (!driveFolderId) return;
    onFilesChanged?.(driveFolderId, files.length, totalSizeBytes);
  }, [files]);

  const handleUpload = async () => {
    if (!driveFolderId || !collegeId || !userId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const items: UploadItem[] = result.assets.map((f) => ({
        name: f.name,
        progress: 0,
        status: "uploading",
      }));
      setUploadItems(items);
      setUploading(true);

      for (let i = 0; i < result.assets.length; i++) {
        const file = result.assets[i];
        try {
          const res = await saveDriveFile(
            {
              driveFolderId,
              collegeId,
              fileName: file.name,
              fileType: file.mimeType || "application/octet-stream",
              fileSize: file.size,
              fileUri: file.uri,
            },
            userId,
          );

          if (!res.success) throw new Error("Upload failed");

          const updated = await fetchDriveFilesByFolder(driveFolderId);
          setFiles(updated as DriveFileRow[]);

          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, progress: 100, status: "done" } : item,
            ),
          );
        } catch (e) {
          setUploadItems((prev) =>
            prev.map((item, idx) =>
              idx === i ? { ...item, status: "error" } : item,
            ),
          );
        }
      }

      Toast.show({
        type: "success",
        text1: result.assets.length > 1 ? `${result.assets.length} files uploaded` : "File uploaded",
      });
      setUploading(false);
      setTimeout(() => setUploadItems([]), 3000);
    } catch (err) {
      setUploading(false);
      Toast.show({ type: "error", text1: "Failed to open document picker" });
    }
  };

  const handleReplaceFile = async (fileId: number) => {
    if (!driveFolderId || !collegeId || !userId) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newFile = result.assets[0];
      const existingFile = files.find((f) => f.driveFileId === fileId);
      if (!existingFile) return;

      setUploading(true);
      setReplacingFileId(fileId);

      const oldPath = `${collegeId}/${driveFolderId}/${existingFile.fileName.trim()}`;
      await supabase.storage.from("college-drive").remove([oldPath]);

      const res = await saveDriveFile(
        {
          driveFileId: fileId, // passing this tells saveDriveFile it's an update
          driveFolderId,
          collegeId,
          fileName: newFile.name,
          fileType: newFile.mimeType || "application/octet-stream",
          fileSize: newFile.size,
          fileUri: newFile.uri,
        },
        userId,
      );

      if (!res.success) throw new Error("Replace failed");

      const updated = await fetchDriveFilesByFolder(driveFolderId);
      setFiles(updated as DriveFileRow[]);
      Toast.show({ type: "success", text1: "File replaced successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to replace file" });
    } finally {
      setUploading(false);
      setReplacingFileId(null);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<number[]>([]);

  const openDeleteModal = (fileIds: number[]) => {
    setFilesToDelete(fileIds);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collegeId || !driveFolderId) return;

    setIsDeletingFile(true);
    const toDelete = files.filter((f) => filesToDelete.includes(f.driveFileId));
    
    // Optimistic update
    setFiles((prev) => prev.filter((f) => !filesToDelete.includes(f.driveFileId)));

    try {
      const results = await Promise.all(
        toDelete.map((f) =>
          deleteDriveFile(f.driveFileId, collegeId, f.driveFolderId, f.fileName)
        )
      );
      
      const anyFailed = results.some((r) => !r.success);
      if (anyFailed) {
        setFiles((prev) => [...toDelete, ...prev]);
        Toast.show({ type: "error", text1: "Failed to delete some files" });
      } else {
        Toast.show({
          type: "success",
          text1: toDelete.length > 1 ? `${toDelete.length} files deleted` : "File deleted",
        });
        setSelectedFileIds([]);
      }
    } catch {
      setFiles((prev) => [...toDelete, ...prev]);
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsDeletingFile(false);
      setDeleteModalOpen(false);
      setFilesToDelete([]);
    }
  };

  const handleDownload = async (file: DriveFileRow) => {
    if (!collegeId) return;
    try {
      const storagePath = `${collegeId}/${file.driveFolderId}/${file.fileName.trim()}`;
      const { data, error } = await supabase.storage
        .from("college-drive")
        .createSignedUrl(storagePath, 120);
        
      if (error || !data?.signedUrl) throw new Error("Could not get url");

      Toast.show({ type: "info", text1: "Downloading..." });

      const { Platform } = require("react-native");
      if (Platform.OS === "web") {
        const response = await fetch(data.signedUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = file.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        const fileUri = FileSystem.documentDirectory + file.fileName.replace(/\s+/g, "_");
        const downloadResult = await FileSystem.downloadAsync(data.signedUrl, fileUri);

        try {
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(downloadResult.uri);
          } else {
            Toast.show({ type: "success", text1: "File downloaded to documents" });
          }
        } catch (shareError) {
          console.warn("Share sheet dismissed or failed:", shareError);
        }
      }
    } catch {
      Toast.show({ type: "error", text1: "Download failed" });
    }
  };

  const toggleSelectFile = (id: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (!open) return null;

  return (
    <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#F8FAFC]">
        {/* Header */}
        <View className="bg-[#43C17A] px-4 py-4 flex-row items-center justify-between shadow-sm z-10 pt-12">
          <View className="flex-row items-center flex-1 pr-4">
            <TouchableOpacity onPress={onClose} className="p-2 mr-2">
              <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg" numberOfLines={1}>
                {folderName}
              </Text>
              <Text className="text-white/80 text-xs">
                {files.length} {files.length === 1 ? "File" : "Files"} · {formatSize(totalSizeBytes)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleUpload}
              disabled={uploading}
              className={`flex-row items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg ${uploading ? "opacity-50" : ""}`}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <UploadSimple size={16} color="#FFF" weight="bold" />
              )}
              <Text className="text-white font-medium text-sm">Upload</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Upload Progress */}
        {uploadItems.length > 0 && (
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            {uploadItems.map((item, idx) => (
              <View key={idx} className="mb-3 last:mb-0">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-xs text-gray-600 flex-1 pr-4" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className={`text-xs font-medium ${item.status === 'error' ? 'text-red-500' : item.status === 'done' ? 'text-[#43C17A]' : 'text-gray-500'}`}>
                    {item.status === 'error' ? 'Failed' : item.status === 'done' ? 'Done ✓' : 'Uploading...'}
                  </Text>
                </View>
                <View className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  {item.status === 'uploading' ? (
                     <View className="h-full bg-blue-400 rounded-full w-1/2" />
                  ) : (
                     <View 
                        className={`h-full rounded-full ${item.status === 'error' ? 'bg-red-500' : 'bg-[#43C17A]'}`} 
                        style={{ width: `${item.progress}%` }} 
                     />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bulk Actions */}
        {selectedFileIds.length > 0 && (
          <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row justify-between items-center">
            <Text className="text-sm font-medium text-gray-700">
              {selectedFileIds.length} selected
            </Text>
            <TouchableOpacity
              onPress={() => openDeleteModal(selectedFileIds)}
              className="flex-row items-center gap-1.5"
            >
              <Trash size={18} color="#EF4444" weight="fill" />
              <Text className="text-red-500 font-medium text-sm">Delete Selected</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* File List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#43C17A" />
          </View>
        ) : files.length === 0 ? (
          <View className="flex-1 justify-center items-center p-8">
            <UploadSimple size={48} color="#D1D5DB" weight="light" className="mb-4" />
            <Text className="text-gray-500 text-center">
              No files yet. Tap Upload to add files here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={files}
            keyExtractor={(item) => item.driveFileId.toString()}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = selectedFileIds.includes(item.driveFileId);
              const isReplacing = replacingFileId === item.driveFileId;
              
              return (
                <TouchableOpacity
                  onPress={() => toggleSelectFile(item.driveFileId)}
                  className={`bg-white rounded-xl mb-3 p-4 flex-row items-center border ${
                    isSelected ? "border-[#43C17A] bg-green-50/30" : "border-gray-200"
                  }`}
                  style={{ opacity: isReplacing ? 0.6 : 1 }}
                >
                  <View className="bg-gray-50 p-2 rounded-lg mr-3">
                    {getFileIcon(item.fileName)}
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium text-sm mb-1" numberOfLines={1}>
                      {item.fileName}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-gray-500 text-xs">{formatSize(item.fileSize)}</Text>
                      <Text className="text-gray-300 text-xs">•</Text>
                      <Text className="text-gray-500 text-xs">{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => handleReplaceFile(item.driveFileId)} className="p-2">
                      <ArrowsClockwise size={20} color="#6B7280" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleDownload(item)} className="p-2">
                      <DownloadSimple size={20} color="#43C17A" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => openDeleteModal([item.driveFileId])} className="p-2">
                      <Trash size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
      <DeleteFileModal
        open={deleteModalOpen}
        fileName={filesToDelete.length === 1 ? files.find((f) => f.driveFileId === filesToDelete[0])?.fileName || "" : `${filesToDelete.length} files`}
        onCancel={() => {
          setDeleteModalOpen(false);
          setFilesToDelete([]);
        }}
        onConfirm={handleDeleteConfirm}
        loading={isDeletingFile}
      />
    </Modal>
  );
}

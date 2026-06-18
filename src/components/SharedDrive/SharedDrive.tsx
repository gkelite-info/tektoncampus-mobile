import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabaseClient";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { Plus } from "phosphor-react-native";

import {
  DriveFolderRow,
  fetchRootDriveFolders,
  saveDriveFolder,
  deleteDriveFolder } from
"@/lib/helpers/drive/driveFolderAPI";
import {
  DriveFileRow,
  fetchFolderStats,
  fetchRecentDriveFiles } from
"@/lib/helpers/drive/driveFilesAPI";
import { useUser } from "@/utils/context/UserContext";

import { FolderCard, FolderItemProps } from "./components/FolderCard";
import RecentFileCard from "./components/RecentFileCard";
import FileListItem from "./components/FileListItem";
import NewFolderModal from "./components/modal/NewFolderModal";
import RenameFolderModal from "./components/modal/RenameFolderModal";
import DeleteFolderModal from "./components/modal/DeleteFolderModal";
import ReplaceFolderModal from "./components/modal/ReplaceFolderModal";
import FolderFilesModal from "./components/modal/FolderFilesModal";

import DeleteFileModal from "./components/modal/DeleteFileModal";

type RecentFile = {
  driveFileId: number;
  driveFolderId: number;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  createdAt: string;
  accessedAt: string;
};

const MAX_RECENT = 10;
const getRecentKey = (uid: number | null) => `recentlyViewedFiles_${uid ?? "guest"}`;

export default function SharedDrive() {const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { userId, collegeId } = useUser();

  const [collegeName, setCollegeName] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderItemProps[]>([]);
  const [recentFiles, setRecentFiles] = useState<DriveFileRow[]>([]);
  const [recentViewed, setRecentViewed] = useState<RecentFile[]>([]);

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFilesModalOpen, setIsFilesModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderItemProps | null>(null);

  const [folderToRename, setFolderToRename] = useState<FolderItemProps | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<FolderItemProps | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveFileRow | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [duplicateFolderData, setDuplicateFolderData] = useState<{name: string;color: string;} | null>(null);


  useEffect(() => {
    if (userId) {
      AsyncStorage.getItem(getRecentKey(userId)).then((data) => {
        if (data) setRecentViewed(JSON.parse(data));
      });
    }
  }, [userId]);

  useEffect(() => {
    if (!collegeId) return;
    supabase.
    from("colleges").
    select("collegeName").
    eq("collegeId", collegeId).
    maybeSingle().
    then(({ data }) => {
      if (data) setCollegeName(data.collegeName);
    });
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId || !userId) return;

    setLoadingFolders(true);
    setLoadingFiles(true);

    Promise.all([
    fetchRootDriveFolders(collegeId, userId),
    fetchFolderStats(collegeId, userId),
    fetchRecentDriveFiles(collegeId, 1, 20, userId)]
    ).
    then(([folderData, stats, filesResult]) => {
      setFolders(
        (folderData as DriveFolderRow[]).map((f) => ({
          driveFolderId: f.driveFolderId,
          name: f.folderName,
          color: f.color ?? "#0096A6",
          filesCount: stats[f.driveFolderId]?.totalFiles ?? 0,
          sizeLabel: formatSize(stats[f.driveFolderId]?.totalSizeBytes ?? 0)
        }))
      );

      const { data } = filesResult as unknown as {data: DriveFileRow[];};
      setRecentFiles(data);
    }).
    catch(() => Toast.show({ type: "error", text1: "Failed to load data" })).
    finally(() => {
      setLoadingFolders(false);
      setLoadingFiles(false);
    });
  }, [collegeId, userId]);

  function formatSize(bytes: number | null): string {
    if (!bytes || bytes === 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const addToRecent = async (file: DriveFileRow, uid: number | null) => {
    const existingStr = await AsyncStorage.getItem(getRecentKey(uid));
    const existing: RecentFile[] = existingStr ? JSON.parse(existingStr) : [];

    const filtered = existing.filter((f) => f.driveFileId !== file.driveFileId);
    const updated: RecentFile[] = [
    {
      driveFileId: file.driveFileId,
      driveFolderId: file.driveFolderId,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
      accessedAt: new Date().toISOString()
    },
    ...filtered].
    slice(0, MAX_RECENT);

    await AsyncStorage.setItem(getRecentKey(uid), JSON.stringify(updated));
    return updated;
  };

  const handleCreateFolder = async (data: {name: string;color: string;}) => {
    if (!collegeId || !userId) return;

    const existingFolder = folders.find(
      (f) => f.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    );

    if (existingFolder) {
      setDuplicateFolderData(data);
      setIsReplaceModalOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveDriveFolder(
        { collegeId, folderName: data.name, parentFolderId: null, color: data.color },
        userId
      );

      if (!result.success) throw new Error("Failed");

      setFolders((prev) => [
      {
        driveFolderId: result.driveFolderId!,
        name: data.name,
        color: data.color,
        filesCount: 0,
        sizeLabel: "0 KB"
      },
      ...prev]
      );

      setIsNewFolderOpen(false);
      Toast.show({ type: "success", text1: "Folder created successfully" });
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFolderName = async (newName: string) => {
    if (!folderToRename || !collegeId || !userId) return;

    setIsRenaming(true);
    try {
      const result = await saveDriveFolder(
        {
          driveFolderId: folderToRename.driveFolderId,
          collegeId,
          folderName: newName,
          parentFolderId: null
        },
        userId
      );

      if (!result.success) throw new Error("Failed to rename");

      setFolders((prev) =>
      prev.map((f) =>
      f.driveFolderId === folderToRename.driveFolderId ? { ...f, name: newName } : f
      )
      );
      setFolderToRename(null);
      Toast.show({ type: "success", text1: "Folder renamed" });
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmReplace = async () => {
    if (!duplicateFolderData || !collegeId || !userId) return;

    setIsReplaceModalOpen(false);
    setIsSaving(true);

    try {
      const existing = folders.find(
        (f) => f.name.toLowerCase().trim() === duplicateFolderData.name.toLowerCase().trim()
      );

      if (existing) {
        const deleteResult = await deleteDriveFolder(existing.driveFolderId, collegeId);
        if (!deleteResult.success) throw new Error("Delete failed");
      }

      const result = await saveDriveFolder(
        { collegeId, folderName: duplicateFolderData.name, parentFolderId: null },
        userId
      );

      if (!result.success) throw new Error("Save failed");

      const colorsData = await AsyncStorage.getItem("folderColors");
      const savedColors: Record<number, string> = colorsData ? JSON.parse(colorsData) : {};
      savedColors[result.driveFolderId!] = duplicateFolderData.color;

      if (existing) delete savedColors[existing.driveFolderId];
      await AsyncStorage.setItem("folderColors", JSON.stringify(savedColors));

      setFolders((prev) => [
      {
        driveFolderId: result.driveFolderId!,
        name: duplicateFolderData.name,
        color: duplicateFolderData.color,
        filesCount: 0,
        sizeLabel: "0 KB"
      },
      ...prev.filter(
        (f) => f.name.toLowerCase().trim() !== duplicateFolderData.name.toLowerCase().trim()
      )]
      );

      setIsNewFolderOpen(false);
      Toast.show({ type: "success", text1: "Folder replaced successfully" });
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsSaving(false);
      setDuplicateFolderData(null);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!folderToDelete || !collegeId) return;

    setIsDeleting(true);

    try {
      const result = await deleteDriveFolder(folderToDelete.driveFolderId, collegeId);

      if (!result.success) throw new Error("Failed");

      setFolders((prev) => prev.filter((f) => f.driveFolderId !== folderToDelete.driveFolderId));
      setRecentFiles((prev) => prev.filter((f) => f.driveFolderId !== folderToDelete.driveFolderId));

      const existingStr = await AsyncStorage.getItem(getRecentKey(userId));
      const existing: RecentFile[] = existingStr ? JSON.parse(existingStr) : [];
      const updatedRecent = existing.filter((f) => f.driveFolderId !== folderToDelete.driveFolderId);

      await AsyncStorage.setItem(getRecentKey(userId), JSON.stringify(updatedRecent));
      setRecentViewed(updatedRecent);

      const colorsData = await AsyncStorage.getItem("folderColors");
      const savedColors: Record<number, string> = colorsData ? JSON.parse(colorsData) : {};
      delete savedColors[folderToDelete.driveFolderId];
      await AsyncStorage.setItem("folderColors", JSON.stringify(savedColors));

      setFolderToDelete(null);
      Toast.show({ type: "success", text1: "Folder deleted" });
    } catch {
      Toast.show({ type: "error", text1: "Something went wrong" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = async (file: DriveFileRow) => {
    if (!collegeId) return;
    try {
      const storagePath = `${collegeId}/${file.driveFolderId}/${file.fileName.trim()}`;
      const { data, error } = await supabase.storage.
      from("college-drive").
      createSignedUrl(storagePath, 120);

      if (error || !data?.signedUrl) return;

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

      const updated = await addToRecent(file, userId);
      setRecentViewed(updated);
    } catch {
      Toast.show({ type: "error", text1: "Download failed" });
    }
  };

  const handleConfirmDeleteFile = async () => {
    if (!collegeId || !fileToDelete) return;

    setIsDeletingFile(true);

    try {
      const { error } = await supabase.
      from("drive_files").
      update({ is_deleted: true, deletedAt: new Date().toISOString() }).
      eq("driveFileId", fileToDelete.driveFileId);

      if (error) throw new Error("Failed");

      setRecentFiles((prev) => prev.filter((f) => f.driveFileId !== fileToDelete.driveFileId));

      const existingStr = await AsyncStorage.getItem(getRecentKey(userId));
      const existing: RecentFile[] = existingStr ? JSON.parse(existingStr) : [];
      const updatedRecent = existing.filter((f) => f.driveFileId !== fileToDelete.driveFileId);
      await AsyncStorage.setItem(getRecentKey(userId), JSON.stringify(updatedRecent));
      setRecentViewed(updatedRecent);

      Toast.show({ type: "success", text1: "File deleted" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to delete file" });
    } finally {
      setIsDeletingFile(false);
      setFileToDelete(null);
    }
  };

  return (
    <View className="flex-1 bg-[#F4F5F6]" style={{ paddingTop: insets.top + 120 }}>
      <NewFolderModal
        open={isNewFolderOpen}
        onCancel={() => !isSaving && setIsNewFolderOpen(false)}
        onSave={handleCreateFolder}
        loading={isSaving} />
      

      <FolderFilesModal
        open={isFilesModalOpen}
        onClose={() => setIsFilesModalOpen(false)}
        folderName={selectedFolder ? `${collegeName ?? "College"} ( ${selectedFolder.name} )` : ""}
        driveFolderId={selectedFolder?.driveFolderId ?? null}
        collegeId={collegeId}
        onFilesChanged={(id, count, sizeBytes) => {
          setFolders((prev) =>
          prev.map((f) =>
          f.driveFolderId === id ?
          { ...f, filesCount: count, sizeLabel: formatSize(sizeBytes) } :
          f
          )
          );
        }} />
      

      <RenameFolderModal
        open={!!folderToRename}
        currentName={folderToRename?.name || ""}
        onCancel={() => setFolderToRename(null)}
        onSave={handleSaveFolderName}
        loading={isRenaming} />
      

      <DeleteFolderModal
        open={!!folderToDelete}
        folderName={folderToDelete?.name || ""}
        onCancel={() => setFolderToDelete(null)}
        onConfirm={handleConfirmDeleteFolder}
        loading={isDeleting} />
      

      <ReplaceFolderModal
        open={isReplaceModalOpen}
        folderName={duplicateFolderData?.name || ""}
        onCancel={() => {
          setIsReplaceModalOpen(false);
          setDuplicateFolderData(null);
        }}
        onConfirm={handleConfirmReplace}
        loading={isSaving} />
      
      
      <DeleteFileModal
        open={!!fileToDelete}
        fileName={fileToDelete?.fileName || ""}
        onCancel={() => setFileToDelete(null)}
        onConfirm={handleConfirmDeleteFile}
        loading={isDeletingFile} />
      

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-semibold text-[#282828] mb-1">{t("Auto.Common.Drive", "Drive")}

            </Text>
            <Text className="text-sm text-gray-500">{t("Auto.Common.Manageorganizem", "Manage, organize & monitor files")}

            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsNewFolderOpen(true)}
            className="bg-[#43C17A] p-2 rounded-full shadow-sm">
            
            <Plus size={24} color="#FFF" weight="bold" />
          </TouchableOpacity>
        </View>

        {}
        <View className="mt-4 px-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">{t("Auto.Common.Folders", "Folders")}

          </Text>
          {loadingFolders ?
          <ActivityIndicator size="small" color="#43C17A" /> :

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={folders}
            keyExtractor={(f) => f.driveFolderId.toString()}
            renderItem={({ item }) =>
            <FolderCard
              {...item}
              onRename={() => setFolderToRename(item)}
              onDelete={() => setFolderToDelete(item)}
              onClick={() => {
                setSelectedFolder(item);
                setIsFilesModalOpen(true);
              }} />

            }
            ListEmptyComponent={
            <Text className="text-sm text-gray-400 mt-2">{t("Auto.Common.Nofoldersyet", "No folders yet")}

            </Text>
            } />

          }
        </View>

        {}
        <View className="mt-6 px-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">{t("Auto.Common.Recent", "Recent")}

          </Text>
          {recentViewed.length > 0 ?
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recentViewed}
            keyExtractor={(f) => f.driveFileId.toString()}
            renderItem={({ item }) =>
            <RecentFileCard
              name={item.fileName}
              type={item.fileName.split(".").pop()?.toUpperCase() ?? "FILE"}
              sizeLabel={formatSize(item.fileSize)}
              date={new Date(item.accessedAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short"
              })}
              onPress={() => {

                handleDownloadFile({
                  ...item,
                  collegeId: collegeId!,
                  fileUrl: "",
                  uploadedBy: 0,
                  is_deleted: false,
                  updatedAt: "",
                  deletedAt: null
                });
              }} />

            } /> :


          <Text className="text-sm text-gray-400">{t("Auto.Common.Norecentlyviewe", "No recently viewed files yet")}

          </Text>
          }
        </View>

        <View className="mt-6 px-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">{t("Auto.Common.AllFiles", "All Files")}

          </Text>
          {loadingFiles ?
          <ActivityIndicator size="small" color="#43C17A" /> :
          recentFiles.length > 0 ?
          recentFiles.map((file) =>
          <FileListItem
            key={file.driveFileId}
            file={file}
            onDownload={handleDownloadFile}
            onDelete={(file) => setFileToDelete(file)}
            isDeleting={isDeletingFile && fileToDelete?.driveFileId === file.driveFileId} />

          ) :

          <Text className="text-sm text-gray-400">{t("Auto.Common.Nofilesfound", "No files found")}

          </Text>
          }
        </View>
      </ScrollView>
    </View>);

}
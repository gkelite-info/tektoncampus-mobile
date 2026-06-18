import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity } from 'react-native';
import { FilePdf, FileXls, FileDoc, FileText, DownloadSimple, Trash } from "phosphor-react-native";
import { DriveFileRow } from "@/lib/helpers/drive/driveFilesAPI";
import { useTranslation } from "react-i18next";

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
  if (name.endsWith(".pdf")) return <FilePdf size={24} color="#E44D26" weight="fill" />;
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return <FileXls size={24} color="#1D6F42" weight="fill" />;
  if (name.endsWith(".doc") || name.endsWith(".docx")) return <FileDoc size={24} color="#2B579A" weight="fill" />;
  return <FileText size={24} color="#6B7280" weight="fill" />;
}

export type FileListItemProps = {
  file: DriveFileRow;
  onDownload: (file: DriveFileRow) => void;
  onDelete: (file: DriveFileRow) => void;
  isDeleting: boolean;
};

export default function FileListItem({
  file,
  onDownload,
  onDelete,
  isDeleting,
}: FileListItemProps) {
  const ext = file.fileName.split(".").pop()?.toUpperCase() || "FILE";

  return (
    <View className="bg-white rounded-xl mb-3 p-4 flex-row items-center border border-gray-100 shadow-sm">
      <View className="bg-gray-50 p-2 rounded-lg mr-3">
        {getFileIcon(file.fileName)}
      </View>
      
      <View className="flex-1 mr-2">
        <Text className="text-gray-900 font-medium text-sm mb-1" numberOfLines={1}>
          {file.fileName}
        </Text>
        <View className="flex-row items-center flex-wrap">
          <Text className="text-gray-500 text-xs">{formatSize(file.fileSize)}</Text>
          <Text className="text-gray-300 text-xs mx-1">•</Text>
          <Text className="text-gray-400 text-xs uppercase">{ext}</Text>
          <Text className="text-gray-300 text-xs mx-1">•</Text>
          <Text className="text-gray-500 text-xs">{formatDate(file.createdAt)}</Text>
        </View>
      </View>
      
      <View className="flex-row items-center gap-2">
        <TouchableOpacity 
          onPress={() => onDownload(file)} 
          className="p-2"
          disabled={isDeleting}
        >
          <DownloadSimple size={20} color="#43C17A" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onDelete(file)} 
          className="p-2"
          disabled={isDeleting}
        >
          <Trash size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FilePdf, FileXls, FileDoc, FileText, Clock } from "phosphor-react-native";

export type RecentFileProps = {
  name: string;
  type: string;
  sizeLabel: string;
  date: string;
  onPress?: () => void;
};

function getFileIcon(type: string) {
  const ext = type.toLowerCase();
  if (ext.includes("pdf")) return <FilePdf size={24} color="#E44D26" weight="fill" />;
  if (ext.includes("xls") || ext.includes("csv")) return <FileXls size={24} color="#1D6F42" weight="fill" />;
  if (ext.includes("doc")) return <FileDoc size={24} color="#2B579A" weight="fill" />;
  return <FileText size={24} color="#6B7280" weight="fill" />;
}

export default function RecentFileCard({
  name,
  type,
  sizeLabel,
  date,
  onPress,
}: RecentFileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="bg-white rounded-xl p-3 mr-3 w-48 border border-gray-100 flex-row items-center shadow-sm"
    >
      <View className="bg-gray-50 p-2 rounded-lg mr-3">
        {getFileIcon(type)}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium text-sm mb-1" numberOfLines={1}>
          {name}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-gray-500 text-xs">{sizeLabel}</Text>
          <Text className="text-gray-300 text-xs mx-1">•</Text>
          <Text className="text-gray-500 text-xs">{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

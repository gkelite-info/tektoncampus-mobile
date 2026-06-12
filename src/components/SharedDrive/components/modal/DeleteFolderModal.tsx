import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";

type DeleteFolderModalProps = {
  open: boolean;
  folderName: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function DeleteFolderModal({
  open,
  folderName,
  onCancel,
  onConfirm,
  loading = false,
}: DeleteFolderModalProps) {
  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
          <Text className="mb-2 text-base font-semibold text-gray-900">
            Delete folder
          </Text>
          
          <Text className="text-sm text-gray-500 mb-6 leading-5">
            Are you sure you want to delete {folderName || "this folder"}? This action cannot be undone.
          </Text>
          
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              className={`rounded-lg border border-gray-300 px-5 py-2 ${
                loading ? "opacity-50" : ""
              }`}
            >
              <Text className="text-sm font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              className={`rounded-lg bg-red-500 px-5 py-2 flex-row items-center gap-2 ${
                loading ? "opacity-60" : ""
              }`}
            >
              {loading && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="font-medium text-white text-sm">
                {loading ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { Modal, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from "react-i18next";
type RenameFolderModalProps = {
  open: boolean;
  currentName: string;
  onCancel: () => void;
  onSave: (newName: string) => void;
  loading?: boolean;
};
export default function RenameFolderModal({
  open,
  currentName,
  onCancel,
  onSave,
  loading = false
}: RenameFolderModalProps) {
  const {
    t
  } = useTranslation();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError("");
    }
  }, [open, currentName]);
  if (!open) return null;
  const handleSave = () => {
    const {
      t
    } = useTranslation();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(t("Drive_module.student.Folder name is required") || "Folder name is required");
      return;
    }
    if (trimmedName.length < 3) {
      setError(t("Drive_module.student.Folder name must be at least 3 characters") || "Folder name must be at least 3 characters");
      return;
    }
    if (trimmedName.length > 50) {
      setError(t("Drive_module.student.Folder name cannot exceed 50 characters") || "Folder name cannot exceed 50 characters");
      return;
    }
    if (!/^[a-zA-Z0-9 _-]+$/.test(trimmedName)) {
      setError(t("Drive_module.student.Only letters, numbers, spaces, - and _ are allowed") || "Only letters, numbers, spaces, - and _ are allowed");
      return;
    }
    if (/\s{2,}/.test(trimmedName)) {
      setError(t("Drive_module.student.Folder name cannot contain multiple spaces") || "Folder name cannot contain multiple spaces");
      return;
    }
    if (/^[\s_-]|[\s_-]$/.test(trimmedName)) {
      setError(t("Drive_module.student.Folder name cannot start or end with space, - or _") || "Folder name cannot start or end with space, - or _");
      return;
    }
    const reservedNames = ["admin", "root", "system"];
    if (reservedNames.includes(trimmedName.toLowerCase())) {
      setError(t("Drive_module.student.This folder name is not allowed") || "This folder name is not allowed");
      return;
    }
    if (trimmedName === currentName.trim()) {
      onCancel();
      return;
    }
    onSave(trimmedName);
  };
  return <Modal visible={open} transparent={true} animationType="fade" onRequestClose={loading ? undefined : onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            {t("Drive_module.student.Rename Folder") || "Rename Folder"}
          </Text>

          <View className="mb-6">
            <Text className="mb-1 text-sm font-medium text-gray-900">
              {t("Drive_module.student.Folder Name") || "Folder Name"}
            </Text>
            <TextInput value={name} onChangeText={text => {
            const {
              t
            } = useTranslation();
            if (/^[a-zA-Z0-9 _-]*$/.test(text)) {
              setName(text);
              setError("");
            } else {
              setError(t("Drive_module.student.Only letters, numbers, spaces, - and _ are allowed") || "Only letters, numbers, spaces, - and _ are allowed");
            }
          }} placeholder={t("Drive_module.student.Enter folder name") || "Enter folder name"} editable={!loading} className={`w-full rounded border px-3 py-2 text-sm text-black ${error ? "border-red-500" : "border-gray-300 focus:border-[#43C17A]"} ${loading ? "opacity-50" : ""}`} />
            {!!error && <Text className="mt-1 text-xs text-red-500">{error}</Text>}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleSave} disabled={loading} className={`flex-1 rounded py-3 flex-row items-center justify-center gap-2 ${loading ? "bg-[#43C17A]/70" : "bg-[#43C17A]"}`}>
              {loading && <ActivityIndicator size="small" color="#FFF" />}
              <Text className="text-sm font-semibold text-white">
                {loading ? t("Drive_module.student.Saving") || "Saving..." : t("Drive_module.student.Rename") || "Rename"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onCancel} disabled={loading} className={`flex-1 rounded border border-gray-300 py-3 items-center justify-center ${loading ? "opacity-50" : ""}`}>
              <Text className="text-sm font-semibold text-gray-900">
                {t("Drive_module.student.Cancel") || "Cancel"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>;
}
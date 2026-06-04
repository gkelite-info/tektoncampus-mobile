import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { WarningCircle } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';

interface Props {
  open?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  name?: string;
}

export default function ConfirmDeleteModal({
  open = false,
  onConfirm,
  onCancel,
  isDeleting = false,
  name = "item"
}: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/60 px-4">
        <View className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm border border-gray-100">
          <View className="flex-col items-center text-center">
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <WarningCircle size={24} color="#DC2626" />
            </View>

            <Text className="text-lg font-semibold text-gray-900 text-center">
              {t("Confirm Deletion")}
            </Text>
            <Text className="mt-2 text-sm text-gray-500 leading-relaxed text-center">
              {t(`Are you sure you want to delete this ${name}? This action cannot be undone and will permanently remove the data.`)}
            </Text>
          </View>

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              disabled={isDeleting}
              onPress={onCancel}
              className={`flex-1 items-center justify-center py-3 rounded-xl ${
                isDeleting ? 'bg-gray-100' : 'bg-gray-100'
              }`}
            >
              <Text className={`font-bold ${isDeleting ? 'text-gray-400' : 'text-gray-700'}`}>
                {t("Cancel")}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              disabled={isDeleting}
              onPress={onConfirm}
              className={`flex-1 items-center justify-center py-3 rounded-xl flex-row gap-2 ${
                isDeleting ? 'bg-red-400' : 'bg-red-600'
              }`}
            >
              {isDeleting ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text className="font-bold text-white">{t("Deleting...")}</Text>
                </>
              ) : (
                <Text className="font-bold text-white">{t("Delete")}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

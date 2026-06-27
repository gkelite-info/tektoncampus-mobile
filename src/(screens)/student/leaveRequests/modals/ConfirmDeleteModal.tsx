import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';

interface ConfirmDeleteModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  title: string;
  name: string;
  confirmText: string;
  actionType: "remove" | "delete";
}

export default function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
  isDeleting,
  title,
  name,
  confirmText,
  actionType,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center bg-black/40 px-4">
        <View className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl flex-col gap-3">
          <Text className="text-lg font-bold text-gray-800">
            {t("Auto.Common.Confirm", "Confirm")} {title}
          </Text>
          <Text className="text-sm text-gray-600 mt-1 leading-relaxed">
            {t("Auto.Common.Areyousureyouwa", "Are you sure you want to")} {actionType} {name}?
          </Text>

          <View className="flex-row gap-3 justify-end mt-4">
            <TouchableOpacity
              onPress={onCancel}
              disabled={isDeleting}
              className="px-5 py-2.5 rounded-lg border border-gray-200 justify-center">
              <Text className="text-sm font-medium text-gray-600">
                {t("Auto.Common.Cancel", "Cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              className={`px-5 py-2.5 rounded-lg justify-center bg-[#FF4B4B]`}>
              <Text className="text-white text-sm font-medium">
                {isDeleting ? 'Wait...' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

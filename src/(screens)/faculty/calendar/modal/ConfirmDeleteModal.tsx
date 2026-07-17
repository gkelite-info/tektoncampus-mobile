import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { CheckCircle, Trash, XCircle } from "phosphor-react-native";

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  title?: string;
  confirmText?: string;
  loadingText?: string;
  name?: string;
  itemName?: string;
  customDescription?: React.ReactNode;
  actionType?: "accept" | "reject" | "remove" | null;
}

export default function ConfirmDeleteModal({
  open,
  onConfirm,
  onCancel,
  isDeleting = false,
  title,
  confirmText,
  loadingText,
  name,
  itemName,
  customDescription,
  actionType = "remove"
}: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  const actualTitle = title || t("Calendar.faculty.delete", "Delete");
  const actualConfirmText = confirmText || t("Calendar.faculty.yesDelete", "Yes, Delete");
  const actualLoadingText = loadingText || t("Calendar.faculty.deleting", "Deleting...");
  const actualName = name || t("Calendar.faculty.eventLowercase", "event");

  const isAccept = actionType === "accept";
  const isRemove = actionType === "remove";
  
  const IconComponent = isAccept ? CheckCircle : isRemove ? Trash : XCircle;
  const iconColor = isAccept ? "#43C17A" : isRemove ? "#DC2626" : "#FF2A2A";
  const ringColor = isAccept ? "bg-green-50 border-green-100" : isRemove ? "bg-red-50 border-red-100" : "bg-red-50 border-red-100";
  const btnColor = isAccept ? "bg-[#43C17A]" : isRemove ? "bg-[#16284F]" : "bg-[#FF2A2A]";

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={isDeleting ? undefined : onCancel}>
      <View className="flex-1 bg-slate-900/40 justify-center items-center px-4">
        <View className="bg-white rounded-2xl w-full max-w-[400px] p-6 shadow-2xl border border-gray-100">
          <View className="items-center mt-2">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-5 border-4 ${ringColor}`}>
              <IconComponent size={32} color={iconColor} weight="duotone" />
            </View>
            
            <Text className="text-xl font-bold text-gray-900 mb-3 text-center">
              {actualTitle} {actualName}?
            </Text>

            <View className="mb-8">
              {customDescription ? (
                customDescription
              ) : isAccept ? (
                <Text className="text-[15px] text-gray-500 text-center leading-relaxed">
                  {t("Calendar.faculty.approveRequestMsg", "Please confirm if you would like to approve the request for")} <Text className="font-semibold text-gray-700">{actualName}</Text>. {t("Calendar.faculty.approveRequestMsg2", "They will be officially added to your club members list.")}
                </Text>
              ) : actionType === "reject" ? (
                <Text className="text-[15px] text-gray-500 text-center leading-relaxed">
                  {t("Calendar.faculty.declineRequestMsg", "Please confirm if you would like to decline the request for")} <Text className="font-semibold text-gray-700">{actualName}</Text>. {t("Calendar.faculty.declineRequestMsg2", "This will clear them from your pending approvals.")}
                </Text>
              ) : (
                <Text className="text-[15px] text-gray-500 text-center leading-relaxed">
                  {t("Calendar.faculty.areYouSureTitle", "Are you sure you want to")} {actualTitle.toLowerCase()} <Text className="font-semibold text-gray-700">{actualName}</Text>?
                  {isRemove && " " + t("Calendar.faculty.actionCannotBeUndone", "This action cannot be undone and will permanently remove the data.")}
                </Text>
              )}
            </View>

            <View className="flex-row gap-3 w-full">
              <TouchableOpacity
                onPress={onCancel}
                disabled={isDeleting}
                className="flex-1 py-3 bg-white border border-gray-300 rounded-xl items-center justify-center opacity-100"
                style={{ opacity: isDeleting ? 0.5 : 1 }}
              >
                <Text className="text-gray-700 font-semibold">{t("Auto.Common.Cancel", "Cancel")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConfirm}
                disabled={isDeleting}
                className={`flex-1 flex-row py-3 rounded-xl items-center justify-center ${btnColor}`}
                style={{ opacity: isDeleting ? 0.7 : 1 }}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" className="mr-2" />
                    <Text className="text-white font-semibold">{actualLoadingText}</Text>
                  </>
                ) : (
                  <Text className="text-white font-semibold">{actualConfirmText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { Modal, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckCircle2, Trash2, XCircle } from "lucide-react-native";
import { fonts } from "@/constants/fonts";

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
  title = "Delete",
  confirmText = "Yes, Delete",
  loadingText = "Deleting...",
  name = "event",
  customDescription,
  actionType = "remove"
}: Props) {const { t } = useTranslation();
  const isAccept = actionType === "accept";
  const isRemove = actionType === "remove";

  const IconComponent = isAccept ? CheckCircle2 : isRemove ? Trash2 : XCircle;
  const iconColor = isAccept ? "#43C17A" : isRemove ? "#DC2626" : "#FF2A2A";

  const ringColorClass = isAccept ?
  "bg-green-50 border-green-100" :
  isRemove ?
  "bg-gray-100 border-gray-200" :
  "bg-red-50 border-red-100";

  const btnColorClass = isAccept ?
  "bg-[#43C17A]" :
  isRemove ?
  "bg-[#16284F]" :
  "bg-[#FF2A2A]";

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={!isDeleting ? onCancel : undefined}>
      
            <View className="flex-1 justify-center items-center bg-slate-900/40 px-4">
                <TouchableOpacity
          activeOpacity={1}
          disabled={isDeleting}
          onPress={onCancel}
          className="absolute inset-0 w-full h-full" />
        

                <View className="bg-white rounded-2xl w-full max-w-[340px] p-6 shadow-2xl border border-gray-100 items-center text-center">
                    <View className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border-4 ${ringColorClass}`}>
                        <IconComponent size={32} color={iconColor} />
                    </View>

                    <Text className="text-xl text-gray-900 mb-2 text-center" style={{ fontFamily: fonts.bold }}>
                        {title} {name}?
                    </Text>

                    <View className="mb-6 w-full">
                        {customDescription ?
            typeof customDescription === "string" ?
            <Text className="text-[14px] text-gray-500 text-center leading-5" style={{ fontFamily: fonts.regular }}>{customDescription}</Text> :

            customDescription :

            actionType === "accept" ?
            <Text className="text-[14px] text-gray-500 text-center leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Pleaseconfirmif", "Please confirm if you would like to approve the request for")}
              {" "}
                                <Text className="text-gray-700" style={{ fontFamily: fonts.semiBold }}>{name}</Text>{t("Auto.Common.Theywillbeoffic", ". They will be officially added to your club members list.")}
            </Text> :
            actionType === "reject" ?
            <Text className="text-[14px] text-gray-500 text-center leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Pleaseconfirmif", "Please confirm if you would like to decline the request for")}
              {" "}
                                <Text className="text-gray-700" style={{ fontFamily: fonts.semiBold }}>{name}</Text>{t("Auto.Common.Thiswillclearth", ". This will clear them from your pending approvals.")}
            </Text> :

            <Text className="text-[14px] text-gray-500 text-center leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Areyousureyouwa", "Are you sure you want to")}
              {title.toLowerCase()}{" "}
                                <Text className="text-gray-700" style={{ fontFamily: fonts.semiBold }}>{name}</Text>?
                                {actionType === "remove" && " This action cannot be undone and will permanently remove the data."}
                            </Text>
            }
                    </View>

                    <View className="flex-row gap-x-3 w-full">
                        <TouchableOpacity
              onPress={onCancel}
              disabled={isDeleting}
              className="flex-1 border border-gray-300 bg-white py-3 rounded-xl active:bg-gray-50 disabled:opacity-50">
              
                            <Text className="text-gray-700 text-center" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Cancel", "Cancel")}

              </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
              onPress={onConfirm}
              disabled={isDeleting}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl disabled:opacity-70 ${btnColorClass}`}>
              
                            {isDeleting ?
              <View className="flex-row items-center justify-center">
                                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-2" />
                                    <Text className="text-white text-center" style={{ fontFamily: fonts.bold }}>
                                        {loadingText}
                                    </Text>
                                </View> :

              <Text className="text-white text-center" style={{ fontFamily: fonts.bold }}>
                                    {confirmText}
                                </Text>
              }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>);

}
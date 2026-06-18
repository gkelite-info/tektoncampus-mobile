import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { fonts } from "@/constants/fonts";
import { useTranslations } from "@/utils/useTranslations";
interface ConfirmActionModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  confirmClassName?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}
export default function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  loadingLabel,
  isLoading = false,
  confirmClassName = "bg-[#43C17A]",
  onCancel,
  onConfirm
}: ConfirmActionModalProps) {
  const {
    t
  } = useTranslation();
  return <Modal transparent visible={true} animationType="fade" onRequestClose={isLoading ? undefined : onCancel}>
            <TouchableOpacity activeOpacity={1} className="flex-1 bg-black/40 justify-center items-center px-4" onPress={isLoading ? undefined : onCancel}>
                <TouchableOpacity activeOpacity={1} className="w-full bg-white rounded-2xl p-6">
                    <Text className="text-lg text-[#282828] mb-2" style={{
          fontFamily: fonts.semiBold
        }}>
                        {title}
                    </Text>
                    <Text className="text-sm text-gray-500 leading-5 mb-6" style={{
          fontFamily: fonts.regular
        }}>
                        {description}
                    </Text>
                    
                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={onCancel} disabled={isLoading} className={`flex-1 py-3 rounded-xl border border-gray-300 items-center justify-center ${isLoading ? 'opacity-50' : ''}`}>
                            <Text className="text-gray-700" style={{
              fontFamily: fonts.semiBold
            }}>
                                {t("Cancel")}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={onConfirm} disabled={isLoading} className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${confirmClassName} ${isLoading ? 'opacity-70' : ''}`}>
                            {isLoading && <ActivityIndicator color="white" size="small" className="mr-2" />}
                            <Text className="text-white" style={{
              fontFamily: fonts.semiBold
            }}>
                                {isLoading ? loadingLabel || confirmLabel : confirmLabel}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>;
}
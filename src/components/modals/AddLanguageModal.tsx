import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, Modal, TextInput } from 'react-native';
import { X } from "phosphor-react-native";
import Toast from "react-native-toast-message";

type AddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (value: string) => void;
};

const toPascalCase = (str: string) =>
str.
split(" ").
map((word) => {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}).
join(" ");

export default function AddLanguageModal({ isOpen, onClose, onAdd }: AddModalProps) {const { t } = useTranslation();
  const [value, setValue] = useState("");

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      Toast.show({ type: "error", text1: "Language name is required" });
      return;
    }
    const formatted = toPascalCase(trimmed).replace(/\s+/g, " ");
    onAdd(formatted);
    setValue("");
    onClose();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
                <View className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-medium text-gray-800">{t("Auto.Common.AddLanguage", "Add Language")}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
                            <X size={18} color="#525252" />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm text-gray-600 mb-1">{t("Auto.Common.Languagename", "Language name")}</Text>
                        <TextInput
              value={value}
              onChangeText={(t) => setValue(toPascalCase(t))}
              placeholder={t("Auto.Attr.egEnglishHindi", "e.g. English, Hindi")}
              className="border border-[#CCCCCC] rounded-md px-3 py-2.5 text-gray-800" />
            
                    </View>

                    <View className="flex-row justify-end gap-3">
                        <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-md border border-[#CCCCCC]">
                            <Text className="text-gray-600">{t("Auto.Common.Cancel", "Cancel")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
              onPress={handleAdd}
              className="px-4 py-2 rounded-md bg-[#43C17A] items-center justify-center min-w-[100px]">
              
                            <Text className="text-white font-bold">{t("Auto.Common.Add", "Add")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>);

}
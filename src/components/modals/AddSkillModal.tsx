import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, Modal, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { X, CaretDown } from "phosphor-react-native";
import Toast from "react-native-toast-message";

type AddModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (section: "Technical Skills" | "Soft Skills" | "Tools & Frameworks", value: string) => Promise<boolean>;
  defaultSection?: "Technical Skills" | "Soft Skills" | "Tools & Frameworks";
  isLoading?: boolean;
};

const toPascalCase = (str: string) =>
str.
split(" ").
map((word) => {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}).
join(" ");

export default function AddSkillModal({ isOpen, onClose, onAdd, defaultSection = "Technical Skills", isLoading = false }: AddModalProps) {const { t } = useTranslation();
  const [section, setSection] = useState<"Technical Skills" | "Soft Skills" | "Tools & Frameworks">(defaultSection);
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const handleAdd = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      Toast.show({ type: "error", text1: "Skill name is required" });
      return;
    }
    const formatted = toPascalCase(trimmed).replace(/\s+/g, " ");
    const success = await onAdd(section, formatted);
    if (success) {
      setValue("");
      onClose();
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade">
            <View className="flex-1 bg-black/50 justify-center items-center px-4">
                <View className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-medium text-gray-800">{t("Auto.Common.AddSkill", "Add Skill")}</Text>
                        <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-gray-100">
                            <X size={18} color="#525252" />
                        </TouchableOpacity>
                    </View>

                    <View className="mb-4">
                        <Text className="text-sm text-gray-600 mb-1">{t("Auto.Attr.Selectsection", "Select section")}</Text>
                        <TouchableOpacity
              onPress={() => setShowDropdown(!showDropdown)}
              className="border border-[#CCCCCC] rounded-md px-3 py-3 flex-row justify-between items-center">
              
                            <Text className="text-gray-800">{section}</Text>
                            <CaretDown size={16} color="#525252" />
                        </TouchableOpacity>

                        {showDropdown &&
            <View className="border border-[#CCCCCC] rounded-md mt-1 absolute top-[60px] w-full bg-white z-50 shadow-sm">
                                {["Technical Skills", "Soft Skills", "Tools & Frameworks"].map((item) =>
              <TouchableOpacity
                key={item}
                onPress={() => {
                  setSection(item as any);
                  setShowDropdown(false);
                }}
                className="p-3 border-b border-gray-100 last:border-b-0">
                
                                        <Text className="text-gray-800">{item}</Text>
                                    </TouchableOpacity>
              )}
                            </View>
            }
                    </View>

                    <View className="mb-6">
                        <Text className="text-sm text-gray-600 mb-1">{t("Auto.Common.Skillname", "Skill name")}</Text>
                        <TextInput
              value={value}
              onChangeText={(t) => setValue(toPascalCase(t))}
              placeholder={t("Auto.Attr.egNextjs", "e.g. Next.js")}
              className="border border-[#CCCCCC] rounded-md px-3 py-2.5 text-gray-800" />
            
                    </View>

                    <View className="flex-row justify-end gap-3">
                        <TouchableOpacity onPress={onClose} className="px-4 py-2 rounded-md border border-[#CCCCCC]">
                            <Text className="text-gray-600">{t("Auto.Common.Cancel", "Cancel")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
              onPress={handleAdd}
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-[#43C17A] items-center justify-center flex-row min-w-[100px]">
              
                            {isLoading ?
              <ActivityIndicator size="small" color="#ffffff" /> :

              <Text className="text-white font-bold">{t("Auto.Common.AddSkill", "Add Skill")}</Text>
              }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>);

}
import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";

import { getUserLanguages, upsertUserLanguages } from "../../../lib/helpers/profile/profileLanguages";
import AddLanguageModal from "@/components/modals/AddLanguageModal";

export default function ProfileLanguages() {const { t } = useTranslation();
  const { userId } = useUser();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const langs = await getUserLanguages(userId as number);
      setSelected(langs || []);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load languages" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLanguage = (lang: string) => {
    if (!selected.includes(lang)) {
      setSelected([...selected, lang]);
    } else {
      Toast.show({ type: "info", text1: "Language already added" });
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setSelected(selected.filter((l) => l !== lang));
  };

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await upsertUserLanguages(userId as number, selected);
      Toast.show({ type: "success", text1: "Languages saved successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to save languages" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPill = (lang: string) =>
  <View key={lang} className="bg-white border border-gray-200 rounded-full pl-4 pr-2 py-1.5 m-1 flex-row items-center gap-2">
            <Text className="text-gray-700 font-medium text-sm">{lang}</Text>
            <TouchableOpacity onPress={() => handleRemoveLanguage(lang)} className="items-center justify-center bg-gray-100 rounded-full w-6 h-6">
                <X size={14} color="#4b5563" weight="bold" />
            </TouchableOpacity>
        </View>;


  if (loading) {
    return (
      <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadinglanguage", "Loading languages...")}</Text>
            </View>);

  }

  return (
    <ScrollView className="flex-1 bg-white rounded-xl " contentContainerStyle={{ padding: 16 }}>
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.Languages", "Languages")}</Text>
                <TouchableOpacity className="bg-[#43C17A] px-4 py-1.5 rounded-md flex-row items-center justify-center">
                    <Text className="text-white font-medium text-sm">{t("Auto.Common.Next", "Next")}</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-10">
                <Text className="text-sm font-medium text-[#282828] mb-2">{t("Auto.Common.SelectedLanguag", "Selected Languages")}</Text>
                <View className="border border-[#C0C0C0] rounded-md p-3 min-h-[68px] flex-row flex-wrap items-center">
                    {selected.length === 0 ?
          <Text className="text-sm text-gray-400 italic">{t("Auto.Common.Nolanguagessele", "No languages selected.")}</Text> :

          selected.map(renderPill)
          }
                </View>

                {}
                <TouchableOpacity onPress={() => setIsModalOpen(true)} className="border-2 border-dashed border-[#43C17A] rounded-lg p-4 mt-6 items-center justify-center bg-[#43C17A]/5">
                    <Text className="text-[#43C17A] font-bold">{t("Auto.Common.AddLanguage", "+ Add Language")}</Text>
                </TouchableOpacity>

                <View className="flex-row justify-end mt-6">
                    <TouchableOpacity onPress={handleSave} disabled={isSaving} className={`bg-[#43C17A] px-6 py-2.5 rounded-lg ${isSaving ? 'opacity-50' : ''}`}>
                        <Text className="text-white font-bold">{isSaving ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.Save", "Save")}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <AddLanguageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddLanguage} />
      
        </ScrollView>);

}
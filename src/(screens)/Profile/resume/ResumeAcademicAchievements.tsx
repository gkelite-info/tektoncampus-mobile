import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import { getAcademicAchievements, upsertAcademicAchievements, softDeleteAcademicAchievement } from "../../../lib/helpers/resume/academicAchievementsAPI";
export default function ResumeAcademicAchievements() {
  const {
    t
  } = useTranslation();
  const {
    studentId
  } = useUser();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [achievementName, setAchievementName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);
  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const data = await getAcademicAchievements(studentId!);
      setAchievements(data || []);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load academic achievements"
      });
    } finally {
      setIsPageLoading(false);
    }
  };
  const handleAdd = async () => {
    if (!achievementName.trim()) {
      Toast.show({
        type: "error",
        text1: "Achievement Name is required"
      });
      return;
    }
    setIsSaving(true);
    try {
      await upsertAcademicAchievements([{
        studentId: studentId!,
        achievementName: achievementName.trim()
      }]);
      Toast.show({
        type: "success",
        text1: "Achievement added successfully"
      });
      setAchievementName("");
      loadData();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to add achievement"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = (name: string) => {
    Alert.alert("Delete", "Are you sure you want to delete this achievement?", [{
      text: "Cancel",
      style: "cancel"
    }, {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await softDeleteAcademicAchievement(studentId!, name);
          Toast.show({
            type: "success",
            text1: "Deleted successfully"
          });
          loadData();
        } catch (e) {
          Toast.show({
            type: "error",
            text1: "Failed to delete"
          });
        }
      }
    }]);
  };
  if (isPageLoading) {
    return <View className="flex-1 bg-white rounded-xl  items-center justify-center p-4">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadingachievem", "Loading achievements...")}</Text>
            </View>;
  }
  return <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.AcademicAchieve", "Academic Achievements")}</Text>
                </View>

                {achievements.map((item, index) => {
        
        return <View key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 flex-row justify-between items-center">
                        <Text className="font-medium text-gray-800 flex-1 mr-2">{item.achievementName}</Text>
                        <TouchableOpacity onPress={() => handleDelete(item.achievementName)}>
                            <Text className="text-red-500">{t("Auto.Common.Delete", "Delete")}</Text>
                        </TouchableOpacity>
                    </View>;
      })}

                {achievements.length === 0 && <Text className="text-gray-500 mb-4">{t("Auto.Common.Noacademicachie", "No academic achievements added yet.")}</Text>}

                <View className="border border-gray-200 rounded-xl p-4 bg-white mt-4 ">
                    <Text className="text-sm font-medium text-[#43C17A] mb-3">{t("Auto.Common.AddNewAchieveme", "Add New Achievement")}</Text>
                    
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.AchievementName", "Achievement Name *")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-4" placeholder={t("Auto.Attr.EgSecured1stran", "E.g. Secured 1st rank in...")} value={achievementName} onChangeText={setAchievementName} multiline />
          

                    <TouchableOpacity onPress={handleAdd} disabled={isSaving} className="bg-[#43C17A] px-4 py-2.5 rounded-lg items-center">
                        <Text className="text-white font-bold">{isSaving ? "Saving..." : "Add Achievement"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>;
}
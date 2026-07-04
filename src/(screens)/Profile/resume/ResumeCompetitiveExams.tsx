import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import { getCompetitiveExams, upsertCompetitiveExams, softDeleteExam } from "../../../lib/helpers/resume/Resumecompetitiveexamsapi";
export default function ResumeCompetitiveExams() {
  const {
    t
  } = useTranslation();
  const {
    studentId
  } = useUser();
  const [exams, setExams] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [examName, setExamName] = useState("");
  const [score, setScore] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (studentId) loadData();
  }, [studentId]);
  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const data = await getCompetitiveExams(studentId!);
      setExams(data || []);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load exams"
      });
    } finally {
      setIsPageLoading(false);
    }
  };
  const handleAdd = async () => {
    if (!examName.trim() || !score.trim()) {
      Toast.show({
        type: "error",
        text1: "Exam Name and Score are required"
      });
      return;
    }
    setIsSaving(true);
    try {
      await upsertCompetitiveExams([{
        studentId: studentId!,
        examName: examName.trim(),
        score: parseFloat(score) || 0
      }]);
      Toast.show({
        type: "success",
        text1: "Exam added successfully"
      });
      setExamName("");
      setScore("");
      loadData();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to add exam"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = (name: string) => {
    Alert.alert("Delete", "Are you sure you want to delete this exam?", [{
      text: "Cancel",
      style: "cancel"
    }, {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await softDeleteExam(studentId!, name);
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
                <Text className="text-gray-400 mt-2">{t("Auto.Common.Loadingexams", "Loading exams...")}</Text>
            </View>;
  }
  return <ScrollView className="flex-1 bg-[#f6f7f9] p-4">
            <View className="bg-white rounded-lg p-6  mb-10">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-lg font-semibold text-[#000000]">{t("Auto.Common.CompetitiveExam", "Competitive Exams")}</Text>
                </View>

                {exams.map((item, index) => {

        return <View key={index} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 flex-row justify-between items-center">
                        <View>
                            <Text className="font-medium text-gray-800">{item.examName}</Text>
                            <Text className="text-sm text-gray-500">{t("Auto.Common.Score", "Score:")}{item.score}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item.examName)}>
                            <Text className="text-red-500">{t("Auto.Common.Delete", "Delete")}</Text>
                        </TouchableOpacity>
                    </View>;
      })}

                {exams.length === 0 && <Text className="text-gray-500 mb-4">{t("Auto.Common.Noexamsaddedyet", "No exams added yet.")}</Text>}

                <View className="border border-gray-200 rounded-xl p-4 bg-white mt-4 ">
                    <Text className="text-sm font-medium text-[#43C17A] mb-3">{t("Auto.Common.AddNewExam", "Add New Exam")}</Text>
                    
                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.ExamName", "Exam Name *")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-3" placeholder={t("Auto.Attr.EgGREGMATTOEFL", "E.g. GRE, GMAT, TOEFL")} value={examName} onChangeText={setExamName} />
          

                    <Text className="text-sm font-medium text-[#282828] mb-1">{t("Auto.Common.Score", "Score *")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 text-[#282828] mb-4" placeholder={t("Auto.Attr.Eg320", "E.g. 320")} keyboardType="numeric" value={score} onChangeText={setScore} />
          

                    <TouchableOpacity onPress={handleAdd} disabled={isSaving} className="bg-[#43C17A] px-4 py-2.5 rounded-lg items-center">
                        <Text className="text-white font-bold">{isSaving ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.AddExam", "Add Exam")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>;
}
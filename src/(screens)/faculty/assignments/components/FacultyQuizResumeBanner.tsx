import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabaseServer';
import { autoCompleteExpiredQuizzes, fetchIncompleteQuizzesByFacultyId } from '@/lib/helpers/quiz/quizAPI';

interface IncompleteQuiz {
  quizId: number;
  quizTitle: string;
  totalMarks: number;
  startDate: string;
  endDate: string;
  endTime?: string;
  status: "Draft" | "Active";
}

interface FacultyQuizResumeBannerProps {
  marginTop?: number;
  onResume: (quizId: number) => void;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function FacultyQuizResumeBanner({ marginTop = 0, onResume }: FacultyQuizResumeBannerProps) {const { t } = useTranslation();
  const [facultyId, setFacultyId] = useState<number | null>(null);
  const [quizzes, setQuizzes] = useState<IncompleteQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) throw new Error("Not authenticated");

        const { data: userRecord } = await supabase.
        from("users").
        select("userId").
        eq("auth_id", auth.user.id).
        single();

        if (!userRecord) throw new Error("User not found");

        const { data: facultyData } = await supabase.
        from("faculty").
        select("facultyId").
        eq("userId", userRecord.userId).
        single();

        if (facultyData) {
          setFacultyId(facultyData.facultyId);
        }
      } catch (err) {
        console.error("Failed to load faculty details", err);
        setIsLoading(false);
      }
    };

    fetchContext();
  }, []);

  useEffect(() => {
    if (!facultyId) return;

    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        await autoCompleteExpiredQuizzes(facultyId!);
        const data = await fetchIncompleteQuizzesByFacultyId(facultyId!);

        if (mounted) {
          setQuizzes(data as IncompleteQuiz[]);
        }
      } catch (err) {
        console.error("FacultyQuizResumeBanner error:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();

    return () => {
      mounted = false;
    };
  }, [facultyId]);

  if (isLoading) {
    return (
      <View className="w-full mb-4 items-center justify-center p-2" style={{ marginTop }}>
        <ActivityIndicator size="small" color="#F5C842" />
      </View>);

  }

  if (quizzes.length === 0) return null;

  return (
    <View className="w-full bg-[#FFF8E7] border border-[#F5C842] rounded-xl p-4 mb-4" style={{ marginTop }}>
      <Text className="text-sm font-bold text-[#282828] mb-3">{t("Auto.Common.ContinueLeftove", "\uD83D\uDD50 Continue Leftover Quizzes")}

      </Text>

      <View className="flex-col gap-2">
        {quizzes.map((quiz) => {
          const timeStr = quiz.endTime || "23:59:59";
          const isPastDeadline = new Date(`${quiz.endDate}T${timeStr}`) < new Date();

          if (isPastDeadline && quiz.status === "Active") return null;

          return (
            <View
              key={quiz.quizId}
              className="bg-white rounded-lg px-4 py-3 flex-row items-center justify-between border border-gray-200 shadow-sm">
              
              <View className="flex-col flex-1 pr-2">
                <Text className="text-sm font-bold text-[#282828]" numberOfLines={1}>
                  {quiz.quizTitle}
                </Text>
                <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                  {quiz.totalMarks}{t("Auto.Common.Marks", "Marks \u2022")}{formatDate(quiz.startDate)} → {formatDate(quiz.endDate)}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                <View className={`px-2 py-1 rounded-md ${quiz.status === 'Draft' ? 'bg-gray-100' : 'bg-[#D5FFE7]'}`}>
                  <Text className={`text-[10px] font-bold ${quiz.status === 'Draft' ? 'text-gray-500' : 'text-[#43C17A]'}`}>
                    {quiz.status.toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onResume(quiz.quizId)}
                  className="bg-[#43C17A] px-3 py-1.5 rounded-md">
                  
                  <Text className="text-xs font-bold text-white">{t("Auto.Common.Resume", "Resume")}</Text>
                </TouchableOpacity>
              </View>
            </View>);

        })}
      </View>
    </View>);

}
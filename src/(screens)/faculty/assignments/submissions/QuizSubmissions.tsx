import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchQuizById, fetchSubmissionsWithStudentsByQuizId } from '@/lib/helpers/quiz/quizAPI';

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function QuizSubmissions() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { quizId } = route.params || {};

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const [submissionsData, quizData] = await Promise.all([
          fetchSubmissionsWithStudentsByQuizId(quizId),
          fetchQuizById(quizId),
        ]);
        if (cancelled) return;
        setSubmissions(submissionsData);
        setQuizDetails(quizData);
      } catch (err) {
        if (cancelled) return;
        Toast.show({ type: "error", text1: "Failed to fetch submissions" });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [quizId]);

  const renderSubmissionCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center gap-3 flex-1">
        <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
          {item.students?.profileImage ? (
            <Image source={{ uri: item.students.profileImage }} style={{ width: '100%', height: '100%' }} />
          ) : (
            <Image source={require('../../../../../assets/icon.png')} style={{ width: '100%', height: '100%' }} />
          )}
        </View>
        <View className="flex-col gap-0.5 flex-1 pr-2">
          <Text className="text-sm font-bold text-[#43C17A]" numberOfLines={1}>{item.students?.fullName || "-"}</Text>
          <Text className="text-xs text-gray-500">ID: {item.students?.rollNumber || item.studentId}</Text>
          <Text className="text-xs text-gray-500">Section: {item.students?.section || "-"}</Text>
        </View>
      </View>

      <View className="flex-col items-end gap-1 shrink-0">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-bold text-[#282828]">Marks:</Text>
          <View className="bg-[#16284F] px-2 py-1 rounded-md">
            <Text className="text-xs font-bold text-white">{item.totalMarksObtained} / {quizDetails?.totalMarks}</Text>
          </View>
        </View>
        <Text className="text-[10px] text-gray-500">Attempted: {formatDate(item.submittedAt)}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center gap-3 shadow-sm z-10 pt-12">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 rounded-full hover:bg-gray-100">
          <CaretLeft size={24} weight="bold" color="#16284F" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#16284F]">Quiz Submissions</Text>
          <Text className="text-xs text-gray-500">Students who attempted the quiz</Text>
        </View>
      </View>

      <View className="p-4 flex-1">
        {quizDetails && (
          <View className="mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-[#E2DAFF] rounded-xl p-3 items-center justify-center border border-[#D5CAFF] shadow-sm">
                <Text className="text-[10px] font-bold text-[#714EF2] uppercase mb-1 tracking-wider">Due Date</Text>
                <Text className="text-sm font-black text-[#282828]">{formatDate(quizDetails.endDate)}</Text>
              </View>
              <View className="flex-1 bg-[#FFEDDA] rounded-xl p-3 items-center justify-center border border-[#FFDFBC] shadow-sm">
                <Text className="text-[10px] font-bold text-[#FF9E3D] uppercase mb-1 tracking-wider">Total Marks</Text>
                <Text className="text-sm font-black text-[#282828]">{quizDetails.totalMarks}</Text>
              </View>
              <View className="flex-1 bg-[#E6FBEA] rounded-xl p-3 items-center justify-center border border-[#BDECC9] shadow-sm">
                <Text className="text-[10px] font-bold text-[#43C17A] uppercase mb-1 tracking-wider">Submissions</Text>
                <Text className="text-sm font-black text-[#282828]">{submissions.length}</Text>
              </View>
            </View>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#43C17A" className="mt-10" />
        ) : submissions.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500 font-semibold">No submissions yet.</Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={item => item.submissionId.toString()}
            renderItem={renderSubmissionCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

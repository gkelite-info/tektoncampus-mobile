import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { Suspense, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { CaretLeft, CheckCircle, XCircle } from "phosphor-react-native";
import { fetchQuestionsWithOptionsByQuizId } from "@/lib/helpers/quiz/quizQuestionAPI";
import { fetchSubmissionDetails } from "@/lib/helpers/quiz/quizSubmissionAPI";
import { QuizAttemptShimmer } from "./shimmer/QuizAttemptShimmer";
const useTranslations = (namespace: string) => {
  return (key: string) => key;
};
interface QuizViewAnswersProps {
  quiz: any;
  routeParams: {
    submissionId: string;
    quizId: string;
  };
  onBack: (updatedParams: {
    modal: string;
  }) => void;
}
function QuizViewAnswersScreenContent({
  quiz,
  routeParams,
  onBack
}: QuizViewAnswersProps) {
  const {
    t
  } = useTranslation();
  const {
    quizId: activeQuizId,
    submissionId
  } = routeParams;
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!activeQuizId || !submissionId) return;
    async function load() {
      try {
        setIsLoading(true);
        const [questionsData, answersData] = await Promise.all([fetchQuestionsWithOptionsByQuizId(Number(activeQuizId)), fetchSubmissionDetails(Number(submissionId))]);
        setQuestions(questionsData);
        setAnswers(answersData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [activeQuizId, submissionId]);
  const handleBack = () => {
    onBack({
      modal: "performance"
    });
  };
  const totalMarks = quiz?.totalMarks ?? 0;
  const marksObtained = quiz?.totalMarksObtained ?? 0;
  const percentage = totalMarks > 0 ? marksObtained / totalMarks * 100 : 0;
  if (isLoading) return <QuizAttemptShimmer />;
  return <SafeAreaView className="flex-1 bg-[#f4f4f4]">
            <View className="flex-1 p-4 relative">
                <View className="flex-row justify-between items-start mb-4 pt-2">
                    <View className="flex-row items-center gap-2 flex-1 mr-4">
                        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} className="mt-0.5">
              
                            <CaretLeft size={24} color="#282828" weight="bold" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text numberOfLines={1} className="text-lg font-bold text-[#282828]">
                                {quiz?.courseName || t("Assignment.student.Quiz", "Quiz")}
                            </Text>
                            {quiz?.topic ? <Text numberOfLines={1} className="text-xs font-medium text-[#282828]">
                                    {quiz.topic}
                                </Text> : null}
                        </View>
                    </View>

                    <Text className="text-base font-bold text-[#282828] shrink-0">
                        {t("Assignment.student.Score :")}{" "}
                        <Text className="text-[#43C17A]">{quiz?.score || "-"}</Text>
                    </Text>
                </View>

                <View className="mb-5">
                    <View className="h-2.5 w-full bg-[#dcfce7] rounded-full overflow-hidden">
                        <View className="h-full bg-[#43C17A]" style={{
            width: `${percentage}%`
          }} />
            
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{
        paddingBottom: 24
      }} className="flex-1">
          
                    <View className="gap-4">
                        {questions.map((q, index) => {
            
            const studentAnswer = answers.find((a: any) => a.questionId === q.questionId);
            const isCorrect = studentAnswer?.isCorrect ?? false;
            const correctOption = q.quiz_question_options?.find((o: any) => o.isCorrect === true);
            return <View key={q.questionId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  
                                    <View className="flex-row justify-between items-start mb-4 gap-2">
                                        <Text className="text-base font-bold text-[#282828] flex-1">{t("Assignment.student.Q", "Q")}
                      {index + 1}. {q.questionText}
                                        </Text>
                                        <View className={`px-3 py-1 rounded-md ${isCorrect ? "bg-[#43C17A]" : "bg-[#FF3B30]"}`}>
                      
                                            <Text className="text-sm font-bold text-white">
                                                {isCorrect ? t("Assignment.student.Correct") : t("Assignment.student.Wrong")}
                                            </Text>
                                        </View>
                                    </View>

                                    {q.questionType === "Multiple Choice" ? <View className="gap-2">
                                            {q.quiz_question_options?.filter((o: any) => !o.isCorrect || q.questionType === "Multiple Choice").sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((opt: any) => {
                  const isSelected = studentAnswer?.selectedOptionId === opt.optionId;
                  const isThisCorrect = opt.isCorrect;
                  let bgClass = "bg-transparent";
                  let textClass = "text-gray-500";
                  let icon = <View className="w-4 h-4 rounded-full border border-gray-300" />;
                  if (isThisCorrect) {
                    bgClass = "bg-[#d1f4e0]";
                    textClass = "text-[#43C17A]";
                    icon = <CheckCircle size={20} weight="fill" color="#43C17A" />;
                  } else if (isSelected && !isThisCorrect) {
                    bgClass = "bg-[#fce8e6]";
                    textClass = "text-[#FF3B30]";
                    icon = <XCircle size={20} weight="fill" color="#FF3B30" />;
                  }
                  return <View key={opt.optionId} className={`flex-row items-center gap-3 px-3 py-2 rounded-md ${bgClass}`}>
                          
                                                            <View className="w-5 h-5 items-center justify-center shrink-0">
                                                                {icon}
                                                            </View>
                                                            <Text className={`text-sm flex-1 ${textClass}`}>
                                                                {opt.optionText}
                                                            </Text>
                                                        </View>;
                })}
                                        </View> : <View className="gap-2">
                                            <View className={`flex-row items-center gap-3 px-3 py-2 rounded-md ${isCorrect ? "bg-[#d1f4e0]" : "bg-[#fce8e6]"}`}>
                      
                                                <View className="w-5 h-5 items-center justify-center shrink-0">
                                                    {isCorrect ? <CheckCircle size={20} weight="fill" color="#43C17A" /> : <XCircle size={20} weight="fill" color="#FF3B30" />}
                                                </View>
                                                <Text className={`text-sm flex-1 ${isCorrect ? "text-[#43C17A]" : "text-[#FF3B30]"}`}>
                        
                                                    {t("Assignment.student.Your answer:")}{" "}
                                                    {studentAnswer?.writtenAnswer || t("Assignment.student.Not answered")}
                                                </Text>
                                            </View>
                                        </View>}

                                    <View className="flex-row items-center gap-2 mt-4">
                                        <CheckCircle size={20} weight="fill" color="#9be4bc" />
                                        <Text className="text-sm font-semibold text-[#282828] flex-1">
                                            {t("Assignment.student.Correct Answer :")}{" "}
                                            <Text className="text-[#43C17A]">
                                                {correctOption?.optionText || "-"}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>;
          })}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>;
}
export default function QuizViewAnswersScreen({
  quiz,
  routeParams,
  onBack
}: QuizViewAnswersProps) {
  return <Suspense fallback={<View className="flex-1 justify-center items-center bg-[#f4f4f4]">
                    <ActivityIndicator size="large" color="#43C17A" />
                </View>}>
      
            <QuizViewAnswersScreenContent quiz={quiz} routeParams={routeParams} onBack={onBack} />
        </Suspense>;
}
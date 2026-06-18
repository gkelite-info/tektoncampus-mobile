import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, Image, TouchableOpacity, ScrollView } from 'react-native';
import {
  Alarm,
  ArrowLeft,
  CalendarDots,
  ClockCountdown,
  Question,
  ArrowsClockwise,
  UserCircle } from
"phosphor-react-native";
import { fonts } from "@/constants/fonts";

const useTranslations = (namespace: string) => {
  return (key: string) => key;
};

type QuizCardProps = {
  data: {
    id: number | string;
    courseName: string;
    topic: string;
    facultyName: string;
    attemptsLeft: number;
    quizDuration: string;
    timeLimit: string;
    bgColor: string;
  };
  onStartQuiz: (quizId: string) => void;
};

export default function QuizCard({ data, onStartQuiz }: QuizCardProps) {const { t } = useTranslation();

  return (
    <View className="flex-col p-4 bg-white rounded-2xl shadow-xs mb-4 border border-gray-100 w-full">
            <View className="flex-row gap-3">
                <View className={`w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 items-center justify-center`} style={{ backgroundColor: data.bgColor.startsWith('bg-[') ? data.bgColor.replace('bg-[', '').replace(']', '') : '#1A1A1A' }}>
                    <Image
            source={require('../../../../../assets/quiz.png')}
            className="w-full h-full opacity-80"
            resizeMode="cover" />
          
                </View>

                <View className="flex-1 min-w-0">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 min-w-0 pr-1">
                            <Text className="text-[#282828] text-base" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                                {data.courseName}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1} style={{ fontFamily: fonts.regular }}>
                                {data.topic}
                            </Text>
                        </View>
                        <TouchableOpacity
              onPress={() => onStartQuiz(data.id.toString())}
              activeOpacity={0.7}
              className="bg-[#43C17A] px-3 py-1.5 rounded-md shadow-xs">
              
                            <Text className="text-white text-base shrink-0" style={{ fontFamily: fonts.bold }}>
                                {t("Start Quiz")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap gap-y-1.5 gap-2 mt-4 w-full">
                        <View className="flex-row items-center gap-1.5 w-fit pr-1">
                            <UserCircle size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-sm" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Faculty", "Faculty:")}
                {data.facultyName}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1">
                            <ArrowsClockwise size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-sm" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Left", "Left:")}
                {data.attemptsLeft}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-fit pr-1 mt-0.5">
                            <CalendarDots size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-sm" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Duration", "Duration:")}
                {data.quizDuration}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1 mt-0.5">
                            <ClockCountdown size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-sm" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Time", "Time:")}
                {data.timeLimit || "30 mins"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>);

}

type AttemptedQuizCardProps = {
  data: {
    id: number | string;
    submissionId: number | string;
    courseName: string;
    topic: string;
    facultyName: string;
    attemptedOn: string;
    questionsAttempted: string;
    attemptsUsed: string;
    score: string;
    bgColor: string;
  };
  onOpenPerformanceModal: (quizId: string, submissionId: string) => void;
};

export function AttemptedQuizCard({ data, onOpenPerformanceModal }: AttemptedQuizCardProps) {const { t } = useTranslation();
  return (
    <TouchableOpacity
      onPress={() => onOpenPerformanceModal(data.id.toString(), data.submissionId?.toString() || "0")}
      activeOpacity={0.8}
      className="flex-col p-4 bg-white rounded-2xl shadow-xs mb-4 border border-gray-100 w-full">
      
            <View className="flex-row gap-3">
                <View className="w-[72px] h-[72px] rounded-lg overflow-hidden shrink-0 items-center justify-center" style={{ backgroundColor: data.bgColor.startsWith('bg-[') ? data.bgColor.replace('bg-[', '').replace(']', '') : '#1A1A1A' }}>
                    <Image
            source={require('../../../../../assets/quiz.png')}
            className="w-full h-full opacity-80"
            resizeMode="cover" />
          
                </View>

                <View className="flex-1 min-w-0">
                    <View className="flex-row justify-between items-start">
                        <View className="flex-1 min-w-0 pr-1">
                            <Text className="text-[#282828] text-sm" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                                {data.courseName}
                            </Text>
                            <Text className="text-gray-500 text-[11px] mt-0.5" numberOfLines={1} style={{ fontFamily: fonts.regular }}>
                                {data.topic}
                            </Text>
                        </View>
                        <View className="bg-[#43C17A] px-2.5 py-1 rounded-md shadow-xs shrink-0">
                            <Text className="text-white text-[11px]" style={{ fontFamily: fonts.bold }}>{data.score}</Text>
                        </View>
                    </View>
                    <View className="flex-row flex-wrap gap-y-1.5 mt-4 w-full">
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1">
                            <UserCircle size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-[10px]" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Faculty", "Faculty:")}
                {data.facultyName}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1">
                            <CalendarDots size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-[10px]" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Att", "Att:")}
                {data.attemptedOn}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1 mt-0.5">
                            <Question size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-[10px]" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Qs", "Qs:")}
                {data.questionsAttempted}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 w-[50%] pr-1 mt-0.5">
                            <ArrowsClockwise size={14} color="#43C17A" />
                            <Text className="text-gray-600 text-[10px]" numberOfLines={1} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Used", "Used:")}
                {data.attemptsUsed}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>);

}

type QuizAttemptScreenProps = {
  quiz: {
    courseName: string;
    topic: string;
    timeLimit: string;
  };
  onGoBack: () => void;
  onSubmitQuiz: (answers: Record<number, string>) => void;
};

export function QuizAttemptScreenOld({ quiz, onGoBack, onSubmitQuiz }: QuizAttemptScreenProps) {const { t } = useTranslation();
  const MOCK_QUESTIONS = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    question: `Q${i + 1}. Which of the following is not a valid CPU scheduling algorithm?`,
    options: [
    "Round Robin",
    "Shortest Job Next",
    "FCFS (First Come First Serve)",
    "Bubble Sort"]

  }));

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const initialMinutes = parseInt(quiz?.timeLimit?.split(" ")[0]) || 30;
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleOptionChange = (questionId: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const progressCount = Object.keys(answers).length;
  const progressPercentage = progressCount / MOCK_QUESTIONS.length * 100;

  return (
    <View className="flex-1 bg-[#f4f4f4] p-4 w-full">
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 min-w-0 pr-2">
                    <TouchableOpacity onPress={onGoBack} activeOpacity={0.7} className="mb-2 w-8 h-8 justify-center">
                        <ArrowLeft size={24} color="#282828" weight="bold" />
                    </TouchableOpacity>
                    <Text className="text-xl text-[#282828]" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
                        {quiz?.courseName || "N/A"}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
                        {quiz?.topic || "N/A"}
                    </Text>
                </View>

                <View className="flex-row items-center gap-2 bg-[#182142] px-3.5 py-2 rounded-lg shadow-xs">
                    <Alarm size={18} color="#87cefa" weight="fill" />
                    <Text className="text-base text-white" style={{ fontFamily: fonts.bold }}>{formatTime(timeLeft)}</Text>
                </View>
            </View>

            <View className="mb-5">
                <View className="flex-row justify-end mb-1.5">
                    <Text className="text-[#43C17A] text-sm" style={{ fontFamily: fonts.bold }}>
                        {progressCount.toString().padStart(2, "0")}{t("Auto.Common.of", "of")}{MOCK_QUESTIONS.length}
                    </Text>
                </View>
                <View className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                    <View
            className="h-full bg-[#43C17A] rounded-full"
            style={{ width: `${progressPercentage}%` }} />
          
                </View>
            </View>

            <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
                <View className="flex-col gap-4 pb-6">
                    {MOCK_QUESTIONS.map((q) =>
          <View key={q.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
                            <Text className="text-[14px] text-[#282828] mb-3.5 leading-5" style={{ fontFamily: fonts.semiBold }}>
                                {q.question}
                            </Text>

                            <View className="flex-col gap-3">
                                {q.options.map((opt, idx) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.7}
                    onPress={() => handleOptionChange(q.id, opt)}
                    className="flex-row items-center gap-3 py-1">
                    
                                            <View className={`w-4 h-4 rounded-full border items-center justify-center ${isSelected ? "border-[#43C17A]" : "border-gray-300"}`}>
                                                {isSelected &&
                      <View className="w-2 h-2 rounded-full bg-[#43C17A]" />
                      }
                                            </View>
                                            <Text className={`text-sm flex-1 ${isSelected ? "text-[#282828]" : "text-gray-500"}`} style={{ fontFamily: isSelected ? fonts.medium : fonts.regular }}>
                                                {opt}
                                            </Text>
                                        </TouchableOpacity>);

              })}
                            </View>
                        </View>
          )}
                </View>
            </ScrollView>

            <View className="pt-2 border-t border-gray-200 bg-[#f4f4f4]">
                <TouchableOpacity
          onPress={() => onSubmitQuiz(answers)}
          activeOpacity={0.8}
          className="bg-[#43C17A] py-3.5 rounded-xl items-center justify-center shadow-xs">
          
                    <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SubmitQuiz", "Submit Quiz")}</Text>
                </TouchableOpacity>
            </View>
        </View>);

}
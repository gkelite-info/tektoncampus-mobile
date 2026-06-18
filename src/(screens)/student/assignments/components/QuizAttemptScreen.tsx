import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, AppState, AppStateStatus, Modal, SafeAreaView } from 'react-native';
import { XCircle } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import Svg, { Circle } from "react-native-svg";
import { fetchQuestionsWithOptionsByQuizId } from "@/lib/helpers/quiz/quizQuestionAPI";
import { saveBulkSubmissionAnswers } from "@/lib/helpers/quiz/quizSubmissionAnswerAPI";
import { getStudentAttemptCount, saveQuizSubmission } from "@/lib/helpers/quiz/quizSubmissionAPI";
import { fetchQuizById } from "@/lib/helpers/quiz/quizAPI";
import { startOrGetQuizSession, endQuizSession, getSessionStartTime } from "@/lib/helpers/quiz/quizSessionAPI";
import { QuizAttemptShimmer } from "./shimmer/QuizAttemptShimmer";
import { useStudent } from "@/utils/context/student/useStudent";
import { fonts } from "@/constants/fonts";
const useTranslations = (namespace: string) => {
  return (key: string, variables?: Record<string, any>) => {
    if (variables?.count !== undefined) return `You have used all ${variables.count} attempts for this quiz`;
    if (variables?.countdown !== undefined) return `Your quiz will automatically submit in ${variables.countdown} seconds`;
    return key;
  };
};
function QuizExitWarningModal({
  visible,
  countdown,
  onStay,
  onSubmit
}: {
  visible: boolean;
  countdown: number;
  onStay: () => void;
  onSubmit: () => void;
}) {
  const {
    t
  } = useTranslation();
  const R = 34;
  const C = 2 * Math.PI * R;
  const progress = countdown / 10;
  const strokeDashoffset = C * (1 - progress);
  return <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-slate-900/60 p-4">
                <View className="bg-white rounded-3xl w-full max-w-[340px] p-6 shadow-2xl items-center border border-gray-100">
                    {}
                    <View className="w-20 h-20 items-center justify-center mb-6 relative">
                        <Svg width="80" height="80" viewBox="0 0 80 80">
                            {}
                            <Circle cx="40" cy="40" r={R} stroke="#FFD6D6" strokeWidth="5" fill="none" />
              
                            {}
                            <Circle cx="40" cy="40" r={R} stroke="#E13B30" strokeWidth="5" fill="none" strokeDasharray={`${C} ${C}`} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 40 40)" />
              
                        </Svg>
                        <View className="absolute inset-0 items-center justify-center">
                            <Text className="text-3xl font-bold text-[#E13B30]" style={{
              fontFamily: fonts.bold
            }}>
                                {countdown}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-xl text-[#182142] mb-3 text-center" style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.DontSwitchTabs", "\u26A0\uFE0F Don't Switch Tabs!")}

          </Text>
                    <Text className="text-[#5C6B82] text-sm text-center mb-1 leading-relaxed" style={{
          fontFamily: fonts.regular
        }}>{t("Auto.Common.Youswitchedaway", "You switched away from the quiz window. Your quiz will be automatically submitted in")}
            {countdown}{t("Auto.Common.secondsifyoudon", "seconds if you don't return.")}
          </Text>
                    <Text className="text-[#8E9CAE] text-[11px] text-center mb-6" style={{
          fontFamily: fonts.regular
        }}>{t("Auto.Common.Switchingtabsor", "Switching tabs or windows during a quiz is not allowed.")}

          </Text>

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity onPress={onSubmit} activeOpacity={0.8} className="flex-1 py-3 bg-[#FF3B30] rounded-2xl items-center justify-center">
                            <Text className="text-white text-sm" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.SubmitNow", "Submit Now")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onStay} activeOpacity={0.8} className="flex-1 py-3 bg-[#43C17A] rounded-2xl items-center justify-center">
                            <Text className="text-white text-sm" style={{
              fontFamily: fonts.bold
            }}>{t("Auto.Common.ReturntoQuiz", "Return to Quiz")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>;
}
function QuizRefreshModal({
  visible,
  onConfirm,
  onCancel
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    t
  } = useTranslation();
  return <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-slate-900/40 p-4">
                <View className="bg-white rounded-2xl w-full max-w-[360px] p-6 shadow-xl border border-gray-100 items-center">
                    <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-5">
                        <XCircle size={32} color="#FF2A2A" weight="duotone" />
                    </View>
                    <Text className="text-lg font-bold text-gray-900 mb-2 text-center">{t("Quiz Interrupted")}</Text>
                    <Text className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
                        {t("Your quiz session was interrupted due to a page refresh Your progress has been auto-submitted Please check your attempted quizzes or retry from ongoing quizzes")}
                    </Text>
                    <View className="flex-col gap-2 w-full">
                        <TouchableOpacity onPress={onConfirm} className="w-full p-3 rounded-xl bg-[#16284F] items-center">
                            <Text className="text-white font-semibold text-sm">{t("Go to Ongoing Quizzes")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onCancel} className="w-full p-3 rounded-xl border border-gray-300 items-center bg-white">
                            <Text className="text-gray-700 font-semibold text-sm">{t("Stay Here")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>;
}
function QuizAttemptScreenContent({
  quiz,
  onSubmitSuccess,
  navigation
}: {
  quiz: any;
  onSubmitSuccess?: () => void;
  navigation: any;
}) {
  const {
    t
  } = useTranslation();
  const {
    studentId
  } = useStudent();
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<number, {
    optionId?: number;
    writtenAnswer?: string;
  }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizMeta, setQuizMeta] = useState<any>(null);
  const maxAttempts = quizMeta?.maxAttempts ?? quiz?.maxAttempts ?? 3;
  const durationMinutes = quizMeta?.durationMinutes ?? quiz?.durationMinutes ?? 30;
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [showRefreshModal, setShowRefreshModal] = useState(false);
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(10);
  const appStateRef = useRef(AppState.currentState);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const answersRef = useRef(answers);
  const questionsRef = useRef(questions);
  const attemptCountRef = useRef(attemptCount);
  const isSubmittingRef = useRef(isSubmitting);
  const studentIdRef = useRef(studentId);
  const quizIdRef = useRef(quiz?.id);
  const quizMetaRef = useRef<any>(null);
  const tabSwitchCountRef = useRef(0);
  const isSubmitCalledRef = useRef(false);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    attemptCountRef.current = attemptCount;
  }, [attemptCount]);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);
  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);
  useEffect(() => {
    quizMetaRef.current = quizMeta;
  }, [quizMeta]);
  const handleRefreshModalConfirm = useCallback(() => {
    setShowRefreshModal(false);
    navigation.navigate("OngoingQuizzes");
  }, [navigation]);
  const handleRefreshModalCancel = useCallback(() => {
    setShowRefreshModal(false);
  }, []);
  const handleSubmitRef = useRef<(() => Promise<void>) | null>(null);
  handleSubmitRef.current = async () => {
    const {
      t
    } = useTranslation();
    const currentStudentId = studentIdRef.current;
    const currentQuizId = quizIdRef.current;
    if (!currentStudentId || !currentQuizId) {
      Toast.show({
        type: "error",
        text1: t("Missing student or quiz info")
      });
      return;
    }
    if (isSubmitCalledRef.current || isSubmittingRef.current) return;
    isSubmitCalledRef.current = true;
    try {
      setIsSubmitting(true);
      const currentAnswers = answersRef.current;
      const currentQuestions = questionsRef.current;
      const currentAttemptCount = attemptCountRef.current;
      let totalMarksObtained = 0;
      const answersPayload = currentQuestions.map(q => {
        const answer = currentAnswers[q.questionId];
        const marksPerQuestion = quizMetaRef.current?.marksPerQuestion ?? q.marks ?? 1;
        if (q.questionType === "Multiple Choice") {
          const selectedOption = q.quiz_question_options?.find((o: any) => o.optionId === answer?.optionId);
          const isCorrect = selectedOption?.isCorrect ?? false;
          if (isCorrect) totalMarksObtained += marksPerQuestion;
          return {
            questionId: q.questionId,
            selectedOptionId: answer?.optionId ?? null,
            writtenAnswer: null,
            isCorrect,
            marksObtained: isCorrect ? marksPerQuestion : 0
          };
        } else {
          const correctOption = q.quiz_question_options?.find((o: any) => o.isCorrect === true);
          const isCorrect = !!answer?.writtenAnswer && !!correctOption?.optionText && answer.writtenAnswer.trim().toLowerCase() === correctOption.optionText.trim().toLowerCase();
          if (isCorrect) totalMarksObtained += marksPerQuestion;
          return {
            questionId: q.questionId,
            selectedOptionId: null,
            writtenAnswer: answer?.writtenAnswer ?? null,
            isCorrect,
            marksObtained: isCorrect ? marksPerQuestion : 0
          };
        }
      });
      const submissionResult = await saveQuizSubmission({
        quizId: currentQuizId,
        studentId: currentStudentId,
        totalMarksObtained,
        attemptNumber: currentAttemptCount + 1
      });
      if (!submissionResult.success || !submissionResult.submissionId) {
        Toast.show({
          type: "error",
          text1: t("Failed to submit quiz")
        });
        isSubmitCalledRef.current = false;
        return;
      }
      await saveBulkSubmissionAnswers(submissionResult.submissionId, answersPayload);
      await endQuizSession(currentQuizId, currentStudentId, currentAttemptCount + 1);
      Toast.show({
        type: "success",
        text1: t("Quiz submitted successfully!")
      });
      onSubmitSuccess?.();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: t("Something went wrong")
      });
      isSubmitCalledRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };
  const triggerSubmit = useCallback(() => {
    handleSubmitRef.current?.();
  }, []);
  const handleExitWarningStay = useCallback(() => {
    setShowExitWarningModal(false);
    setWarningCountdown(10);
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);
  const handleExitWarningSubmit = useCallback(() => {
    setShowExitWarningModal(false);
    setWarningCountdown(10);
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    setHasAutoSubmitted(true);
    triggerSubmit();
  }, [triggerSubmit]);
  useEffect(() => {
    if (!quiz?.id || !studentId) return;
    async function load() {
      const {
        t
      } = useTranslation();
      try {
        setIsLoading(true);
        const [quizData, questionsData, count] = await Promise.all([fetchQuizById(quiz.id), fetchQuestionsWithOptionsByQuizId(quiz.id), getStudentAttemptCount(quiz.id, studentId as number)]);
        setQuizMeta(quizData);
        setQuestions(questionsData);
        setAttemptCount(count);
        if (count >= (quizData?.maxAttempts ?? 3)) {
          setAlreadyAttempted(true);
          return;
        }
        const session = await startOrGetQuizSession(quiz.id, studentId as number, count + 1);
        const startedAt = new Date(session.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = (quizData?.durationMinutes ?? 30) * 60 - elapsed;
        setTimeLeft(remaining <= 0 ? 0 : remaining);
      } catch (err) {
        Toast.show({
          type: "error",
          text1: t("Failed to load quiz")
        });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [quiz?.id, studentId]);
  useEffect(() => {
    if (isLoading || timeLeft === null) return;
    if (timeLeft <= 0) {
      triggerSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(timer);
          triggerSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, timeLeft === null]);
  useEffect(() => {
    if (isLoading) return;
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current === "active" && nextAppState.match(/inactive|background/)) {
        if (isSubmittingRef.current || hasAutoSubmitted) return;
        if (tabSwitchCountRef.current >= 2) {
          setHasAutoSubmitted(true);
          triggerSubmit();
          return;
        }
        tabSwitchCountRef.current += 1;
        setShowExitWarningModal(true);
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === "active") {
        try {
          const startedAtStr = await getSessionStartTime(quizIdRef.current, studentIdRef.current!, attemptCountRef.current + 1);
          if (startedAtStr) {
            const elapsed = Math.floor((Date.now() - new Date(startedAtStr).getTime()) / 1000);
            const remaining = (quizMetaRef.current?.durationMinutes ?? 30) * 60 - elapsed;
            if (remaining <= 0) {
              setTimeLeft(0);
              triggerSubmit();
            } else {
              setTimeLeft(remaining);
            }
          }
        } catch (e) {}
      }
      appStateRef.current = nextAppState;
    };
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [isLoading, hasAutoSubmitted, triggerSubmit]);
  useEffect(() => {
    if (!showExitWarningModal) return;
    setWarningCountdown(10);
    warningTimerRef.current = setInterval(() => {
      setWarningCountdown(prev => {
        if (prev <= 1) {
          clearInterval(warningTimerRef.current!);
          setShowExitWarningModal(false);
          setHasAutoSubmitted(true);
          triggerSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [showExitWarningModal, triggerSubmit]);
  const handleOptionChange = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        optionId
      }
    }));
  };
  const handleWrittenAnswerChange = (questionId: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        writtenAnswer: text
      }
    }));
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const totalSeconds = durationMinutes * 60;
  const timerPercent = timeLeft !== null ? timeLeft / totalSeconds * 100 : 100;
  let timerBg = "bg-[#182142]";
  let timerTextColor = "text-[#87cefa]";
  if (timerPercent <= 20) {
    timerBg = "bg-[#5c1010]";
    timerTextColor = "text-red-400";
  } else if (timerPercent <= 50) {
    timerBg = "bg-[#7a4a00]";
    timerTextColor = "text-yellow-300";
  }
  const progressCount = Object.keys(answers).length;
  const progressPercentage = questions.length > 0 ? progressCount / questions.length * 100 : 0;
  if (showRefreshModal) {
    return <QuizRefreshModal visible={showRefreshModal} onConfirm={handleRefreshModalConfirm} onCancel={handleRefreshModalCancel} />;
  }
  if (alreadyAttempted) {
    return <View className="flex-1 items-center justify-center bg-gray-50 p-6">
                <View className="bg-white rounded-xl p-8 items-center shadow-sm w-full max-w-sm">
                    <Text className="text-4xl mb-3">✅</Text>
                    <Text className="text-lg font-bold text-[#282828] mb-2">{t("All Attempts Used!")}</Text>
                    <Text className="text-sm text-gray-500 text-center mb-6">
                        {t("You have used all {count} attempts for this quiz Check your score in Attempted Quizzes", {
            count: maxAttempts
          })}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate("AttemptedQuizzes")} className="bg-[#43C17A] px-6 py-3 rounded-xl w-full items-center">
            
                        <Text className="text-white font-bold text-sm">{t("View Attempted Quizzes")}</Text>
                    </TouchableOpacity>
                </View>
            </View>;
  }
  if (isLoading) return <QuizAttemptShimmer />;
  return <SafeAreaView className="flex-1 bg-[#f4f4f4]">
            <View className="flex-1 p-6 relative">
                <QuizExitWarningModal visible={showExitWarningModal} countdown={warningCountdown} onStay={handleExitWarningStay} onSubmit={handleExitWarningSubmit} />

                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-1 pr-4">
                        <Text className="text-2xl text-[#1A1A1A]" style={{
            fontFamily: fonts.bold
          }}>
                            {quiz?.courseName ?? "Quiz"}
                        </Text>
                        <Text className="text-base text-gray-500 mt-1" style={{
            fontFamily: fonts.medium
          }}>
                            {quiz?.topic ?? ""}
                        </Text>
                    </View>

                    <View className="bg-[#131F3F] px-5 py-3.5 rounded-2xl items-center min-w-[110px]">
                        <Text className="text-[10px] text-white tracking-widest opacity-90" style={{
            fontFamily: fonts.bold
          }}>
                            {t("TIME LEFT")}
                        </Text>
                        <Text className="text-3xl text-[#79C1FC] mt-1" style={{
            fontFamily: fonts.bold
          }}>
                            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
                        </Text>
                        <View className="h-[2px] bg-[#79C1FC] w-full mt-1.5 rounded-full" />
                    </View>
                </View>

                <View className="mb-6">
                    <View className="flex-row justify-end mb-2">
                        <Text className="text-[#43C17A] text-base" style={{
            fontFamily: fonts.bold
          }}>
                            {progressCount}{t("Auto.Common.of", "of")}{questions.length}
                        </Text>
                    </View>
                    <View className="h-[8px] w-full bg-[#E5F7ED] rounded-full overflow-hidden">
                        <View className="h-full bg-[#43C17A] rounded-full" style={{
            width: `${progressPercentage}%`
          }} />
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-4">
                    {questions.map((q, qIndex) => {
          
          return <View key={q.questionId} className="bg-white p-6 rounded-2xl mb-6 shadow-sm border border-gray-100">
                            <Text className="text-lg text-[#1A1A1A] mb-5" style={{
              fontFamily: fonts.bold
            }}>
                                {q.questionText}
                            </Text>

                            {q.questionType === "Multiple Choice" ? <View className="flex-col gap-4">
                                    {q.quiz_question_options?.sort((a: any, b: any) => a.displayOrder - b.displayOrder).map((opt: any) => {
                const isSelected = answers[q.questionId]?.optionId === opt.optionId;
                return <TouchableOpacity key={opt.optionId} activeOpacity={0.7} onPress={() => handleOptionChange(q.questionId, opt.optionId)} className="flex-row items-center gap-3 py-1">
                    
                                                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${isSelected ? "border-[#43C17A]" : "border-[#B0B9C3]"}`}>
                                                        {isSelected ? <View className="w-2.5 h-2.5 rounded-full bg-[#43C17A]" /> : null}
                                                    </View>
                                                    <Text className={`text-base flex-1 ${isSelected ? "text-[#1A1A1A]" : "text-[#7B8896]"}`} style={{
                    fontFamily: isSelected ? fonts.medium : fonts.regular
                  }}>
                                                        {opt.optionText}
                                                    </Text>
                                                </TouchableOpacity>;
              })}
                                </View> : <TextInput value={answers[q.questionId]?.writtenAnswer ?? ""} onChangeText={text => handleWrittenAnswerChange(q.questionId, text)} placeholder={t("Type your answer here")} placeholderTextColor="#9ca3af" className="w-full border-b border-gray-200 pb-2 text-base text-[#1A1A1A]" style={{
              fontFamily: fonts.regular
            }} />}
                        </View>;
        })}
                </ScrollView>

                <View className="flex-row justify-end pt-2">
                    <TouchableOpacity onPress={triggerSubmit} disabled={isSubmitting} activeOpacity={0.8} className="bg-[#43C17A] px-8 py-3.5 rounded-2xl items-center justify-center shadow-md disabled:opacity-50">
            
                        {isSubmitting ? <ActivityIndicator size="small" color="#ffffff" /> : <Text className="text-white text-base" style={{
            fontFamily: fonts.bold
          }}>
                                {t("Submit Quiz")}
                            </Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>;
}
export default function QuizAttemptScreen({
  quiz,
  onSubmitSuccess,
  navigation
}: {
  quiz: any;
  onSubmitSuccess?: () => void;
  navigation: any;
}) {
  return <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
            <Suspense fallback={<View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#16284F" /></View>}>
                <QuizAttemptScreenContent quiz={quiz} onSubmitSuccess={onSubmitSuccess} navigation={navigation} />
            </Suspense>
        </Modal>;
}
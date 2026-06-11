import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    AppState,
    AppStateStatus,
    Modal,
} from "react-native";
import { XCircle } from "phosphor-react-native";
import Toast from "react-native-toast-message";

import { fetchQuestionsWithOptionsByQuizId } from "@/lib/helpers/quiz/quizQuestionAPI";
import { saveBulkSubmissionAnswers } from "@/lib/helpers/quiz/quizSubmissionAnswerAPI";
import { getStudentAttemptCount, saveQuizSubmission } from "@/lib/helpers/quiz/quizSubmissionAPI";
import { fetchQuizById } from "@/lib/helpers/quiz/quizAPI";
import { startOrGetQuizSession, endQuizSession, getSessionStartTime } from "@/lib/helpers/quiz/quizSessionAPI";
import { QuizAttemptShimmer } from "./shimmer/QuizAttemptShimmer";
import { useStudent } from "@/utils/context/student/useStudent";

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
    onSubmit,
}: {
    visible: boolean;
    countdown: number;
    onStay: () => void;
    onSubmit: () => void;
}) {
    const t = useTranslations("Assignment.student");
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View className="flex-1 justify-center items-center bg-slate-900/40 p-4">
                <View className="bg-white rounded-2xl w-full max-w-[360px] p-6 shadow-xl border border-gray-100 items-center">
                    <View className="w-20 h-20 mb-5 items-center justify-center rounded-full border-4 border-red-100">
                        <Text className="text-2xl font-bold text-red-500">{countdown}</Text>
                    </View>

                    <Text className="text-lg font-bold text-gray-900 mb-2 text-center">
                        ⚠️ {t("Don't Switch Apps!")}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2 text-center leading-relaxed">
                        {t("You switched away from the quiz window Your quiz will be automatically submitted in {countdown} seconds if you don't return", { countdown })}
                    </Text>
                    <Text className="text-xs text-gray-400 mb-6 text-center">
                        {t("Leaving the app window during a quiz environment is restricted")}
                    </Text>

                    <View className="flex-row gap-3 w-full">
                        <TouchableOpacity onPress={onSubmit} className="flex-1 p-3 rounded-xl bg-red-500 items-center">
                            <Text className="text-white font-semibold text-sm">{t("Submit Now")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onStay} className="flex-1 p-3 rounded-xl bg-[#43C17A] items-center">
                            <Text className="text-white font-semibold text-sm">{t("Return")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function QuizRefreshModal({
    visible,
    onConfirm,
    onCancel,
}: {
    visible: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const t = useTranslations("Assignment.student");
    return (
        <Modal visible={visible} transparent animationType="fade">
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
        </Modal>
    );
}

function QuizAttemptScreenContent({
    quiz,
    onSubmitSuccess,
    navigation,
}: {
    quiz: any;
    onSubmitSuccess?: () => void;
    navigation: any;
}) {
    const t = useTranslations("Assignment.student");
    const { studentId } = useStudent();

    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number, { optionId?: number; writtenAnswer?: string }>>({});
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

    useEffect(() => { answersRef.current = answers; }, [answers]);
    useEffect(() => { questionsRef.current = questions; }, [questions]);
    useEffect(() => { attemptCountRef.current = attemptCount; }, [attemptCount]);
    useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
    useEffect(() => { studentIdRef.current = studentId; }, [studentId]);
    useEffect(() => { quizMetaRef.current = quizMeta; }, [quizMeta]);

    const handleRefreshModalConfirm = useCallback(() => {
        setShowRefreshModal(false);
        navigation.navigate("OngoingQuizzes");
    }, [navigation]);

    const handleRefreshModalCancel = useCallback(() => {
        setShowRefreshModal(false);
    }, []);

    const handleSubmitRef = useRef<(() => Promise<void>) | null>(null);

    handleSubmitRef.current = async () => {
        const currentStudentId = studentIdRef.current;
        const currentQuizId = quizIdRef.current;

        if (!currentStudentId || !currentQuizId) {
            Toast.show({ type: "error", text1: t("Missing student or quiz info") });
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
            const answersPayload = currentQuestions.map((q) => {
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
                        marksObtained: isCorrect ? marksPerQuestion : 0,
                    };
                } else {
                    const correctOption = q.quiz_question_options?.find((o: any) => o.isCorrect === true);
                    const isCorrect = !!answer?.writtenAnswer && !!correctOption?.optionText &&
                        answer.writtenAnswer.trim().toLowerCase() === correctOption.optionText.trim().toLowerCase();
                    if (isCorrect) totalMarksObtained += marksPerQuestion;
                    return {
                        questionId: q.questionId,
                        selectedOptionId: null,
                        writtenAnswer: answer?.writtenAnswer ?? null,
                        isCorrect,
                        marksObtained: isCorrect ? marksPerQuestion : 0,
                    };
                }
            });

            const submissionResult = await saveQuizSubmission({
                quizId: currentQuizId,
                studentId: currentStudentId,
                totalMarksObtained,
                attemptNumber: currentAttemptCount + 1,
            });

            if (!submissionResult.success || !submissionResult.submissionId) {
                Toast.show({ type: "error", text1: t("Failed to submit quiz") });
                isSubmitCalledRef.current = false;
                return;
            }

            await saveBulkSubmissionAnswers(submissionResult.submissionId, answersPayload);
            await endQuizSession(currentQuizId, currentStudentId, currentAttemptCount + 1);

            Toast.show({ type: "success", text1: t("Quiz submitted successfully!") });
            onSubmitSuccess?.();
        } catch (err) {
            Toast.show({ type: "error", text1: t("Something went wrong") });
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
            try {
                setIsLoading(true);
                const [quizData, questionsData, count] = await Promise.all([
                    fetchQuizById(quiz.id),
                    fetchQuestionsWithOptionsByQuizId(quiz.id),
                    getStudentAttemptCount(quiz.id, studentId as number),
                ]);

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
                Toast.show({ type: "error", text1: t("Failed to load quiz") });
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
            setTimeLeft((prev) => {
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

                if (tabSwitchCountRef.current >= 3) {
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
                        const remaining = ((quizMetaRef.current?.durationMinutes ?? 30) * 60) - elapsed;
                        if (remaining <= 0) {
                            setTimeLeft(0);
                            triggerSubmit();
                        } else {
                            setTimeLeft(remaining);
                        }
                    }
                } catch (e) { }
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
            setWarningCountdown((prev) => {
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
        setAnswers((prev) => ({ ...prev, [questionId]: { optionId } }));
    };

    const handleWrittenAnswerChange = (questionId: number, text: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: { writtenAnswer: text } }));
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    const totalSeconds = durationMinutes * 60;
    const timerPercent = timeLeft !== null ? (timeLeft / totalSeconds) * 100 : 100;

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
    const progressPercentage = questions.length > 0 ? (progressCount / questions.length) * 100 : 0;

    if (showRefreshModal) {
        return <QuizRefreshModal visible={showRefreshModal} onConfirm={handleRefreshModalConfirm} onCancel={handleRefreshModalCancel} />;
    }

    if (alreadyAttempted) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50 p-6">
                <View className="bg-white rounded-xl p-8 items-center shadow-sm w-full max-w-sm">
                    <Text className="text-4xl mb-3">✅</Text>
                    <Text className="text-lg font-bold text-[#282828] mb-2">{t("All Attempts Used!")}</Text>
                    <Text className="text-sm text-gray-500 text-center mb-6">
                        {t("You have used all {count} attempts for this quiz Check your score in Attempted Quizzes", { count: maxAttempts })}
                    </Text>
                    <TouchableOpacity
                        onPress={() => navigation.navigate("AttemptedQuizzes")}
                        className="bg-[#43C17A] px-6 py-3 rounded-xl w-full items-center"
                    >
                        <Text className="text-white font-bold text-sm">{t("View Attempted Quizzes")}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (isLoading) return <QuizAttemptShimmer />;

    return (
        <View className="flex-1 bg-[#f4f4f4] p-4 relative">
            <QuizExitWarningModal visible={showExitWarningModal} countdown={warningCountdown} onStay={handleExitWarningStay} onSubmit={handleExitWarningSubmit} />

            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1 pr-2">
                    <Text className="text-lg font-bold text-[#282828]">{quiz?.courseName ?? "Quiz"}</Text>
                    {quiz?.topic ? <Text className="text-xs font-medium text-gray-500 mt-0.5">{quiz.topic}</Text> : null}
                </View>

                <View className={`${timerBg} px-3 py-1.5 rounded-xl items-center min-w-[85px]`}>
                    <Text className={`text-[9px] font-bold uppercase tracking-wider ${timerTextColor} opacity-80`}>{t("Time Left")}</Text>
                    <Text className={`font-bold text-lg ${timerTextColor}`}>{timeLeft !== null ? formatTime(timeLeft) : "--:--"}</Text>
                    <View className="w-full h-[3px] bg-white/20 rounded-full overflow-hidden mt-1">
                        <View className={`h-full rounded-full ${timerPercent > 50 ? "bg-[#87cefa]" : timerPercent > 20 ? "bg-yellow-300" : "bg-red-400"}`} style={{ width: `${timerPercent}%` }} />
                    </View>
                </View>
            </View>

            <View className="mb-4">
                <View className="flex-row justify-between mb-1">
                    <Text className="text-xs font-medium text-gray-400">{t("Quiz Progress")}</Text>
                    <Text className="text-[#43C17A] font-bold text-xs">{progressCount} {t("of")} {questions.length}</Text>
                </View>
                <View className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <View className="h-full bg-[#43C17A]" style={{ width: `${progressPercentage}%` }} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1 mb-2">
                {questions.map((q, qIndex) => (
                    <View key={q.questionId} className="bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                        <Text className="text-sm font-semibold text-[#282828] mb-4">
                            {qIndex + 1}. {q.questionText}
                        </Text>

                        {q.questionType === "Multiple Choice" ? (
                            <View className="flex-col gap-3">
                                {q.quiz_question_options
                                    ?.sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                                    .map((opt: any) => {
                                        const isSelected = answers[q.questionId]?.optionId === opt.optionId;
                                        return (
                                            <TouchableOpacity
                                                key={opt.optionId}
                                                activeOpacity={0.7}
                                                onPress={() => handleOptionChange(q.questionId, opt.optionId)}
                                                className="flex-row items-center gap-3 py-1"
                                            >
                                                <View className={`w-5 h-5 rounded-full border items-center justify-center ${isSelected ? "border-[#43C17A]" : "border-gray-300"}`}>
                                                    {isSelected ? <View className="w-2.5 h-2.5 rounded-full bg-[#43C17A]" /> : null}
                                                </View>
                                                <Text className={`text-sm flex-1 ${isSelected ? "text-[#282828] font-medium" : "text-gray-500"}`}>
                                                    {opt.optionText}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                            </View>
                        ) : (
                            <TextInput
                                value={answers[q.questionId]?.writtenAnswer ?? ""}
                                onChangeText={(text) => handleWrittenAnswerChange(q.questionId, text)}
                                placeholder={t("Type your answer here")}
                                placeholderTextColor="#9ca3af"
                                className="w-full border-b border-gray-200 pb-2 text-sm text-[#282828]"
                            />
                        )}
                    </View>
                ))}
            </ScrollView>

            <View className="pt-2 bg-[#f4f4f4]">
                <TouchableOpacity
                    onPress={triggerSubmit}
                    disabled={isSubmitting}
                    className="bg-[#43C17A] py-3.5 rounded-xl w-full items-center justify-center shadow-sm disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text className="text-white text-sm font-bold">{t("Submit Quiz")}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function QuizAttemptScreen({ quiz, onSubmitSuccess, navigation }: { quiz: any; onSubmitSuccess?: () => void; navigation: any }) {
    return (
        <Suspense fallback={<View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#16284F" /></View>}>
            <QuizAttemptScreenContent quiz={quiz} onSubmitSuccess={onSubmitSuccess} navigation={navigation} />
        </Suspense>
    );
}
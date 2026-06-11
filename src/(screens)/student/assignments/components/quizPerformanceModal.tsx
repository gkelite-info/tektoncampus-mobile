import React from "react";
import {
    View,
    Text,
    Modal,
    Image,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from "react-native";
import { CheckCircle, XCircle, Question, X } from "phosphor-react-native";
import { AttemptedQuizCard } from "./quizCard";

const useTranslations = (namespace: string) => {
    return (key: string, variables?: Record<string, any>) => {
        if (variables?.percent !== undefined) {
            return `you answered ${variables.percent}% of question correctly`;
        }
        return key;
    };
};

interface QuizPerformanceModalProps {
    visible: boolean;
    quiz: {
        score: string;
        percentage: number;
        correct: number;
        wrong: number;
        unanswered: number;
        total: number;
        allAttemptsUsed: boolean;
        id: string | number;
        submissionId: string | number;
        courseName: string;
        topic: string;
        facultyName: string;
        attemptedOn: string;
        questionsAttempted: string;
        attemptsUsed: string;
        bgColor: string;
    };
    onClose: () => void;
    onViewAnswers: () => void;
}

export default function QuizPerformanceModal({
    visible,
    quiz,
    onClose,
    onViewAnswers,
}: QuizPerformanceModalProps) {
    const t = useTranslations("Assignment.student");

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center bg-black/50 p-4">
                <TouchableOpacity
                    activeOpacity={1}
                    className="absolute inset-0"
                    onPress={onClose}
                />

                <View className="bg-white rounded-2xl shadow-xl w-full max-h-[85vh] flex-col overflow-hidden">
                    <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                        <Text className="text-lg font-bold text-gray-800">
                            {t("Performance Summary")}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            className="p-1.5 bg-gray-100 rounded-full items-center justify-center"
                        >
                            <X size={18} color="#4b5563" weight="bold" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        className="flex-1 px-5 py-4"
                    >
                        <View className="mb-5 opacity-90">
                            <AttemptedQuizCard data={quiz} onOpenPerformanceModal={() => { }} />
                        </View>

                        <View className="items-center justify-center my-2">
                            <View className="w-44 h-44 items-center justify-center relative">
                                <Image
                                    source={require("../../../../../assets/result-circle.png")}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />

                                <View className="absolute items-center justify-center">
                                    <Text className="text-3xl font-black text-[#713F06] tracking-tight text-center">
                                        {quiz.score}
                                    </Text>
                                    <Text className="text-sm font-bold text-[#16284F] mt-0.5">
                                        {quiz.percentage}%
                                    </Text>
                                    <Text className="text-xs font-semibold text-gray-400 mt-0.5">
                                        {t("Quiz Score")}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="items-center mt-4 mb-6 px-2">
                            <Text className="text-base font-bold text-[#282828] text-center leading-tight">
                                {t("Good job! you performed well in this quiz")}
                            </Text>
                            <Text className="text-xs text-gray-500 mt-1.5 font-medium text-center">
                                {t("you answered {percent}% of question correctly", {
                                    percent: quiz.percentage,
                                })}
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap gap-3 justify-between mb-6 w-full">
                            <View className="bg-[#f0fcf5] p-3 rounded-xl items-center justify-center border border-[#d1f4e0] w-[47%] shadow-sm">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <CheckCircle weight="fill" size={14} color="#43C17A" />
                                    <Text className="text-[#43C17A] text-[11px] font-bold">{t("Correct")}</Text>
                                </View>
                                <Text className="text-lg font-bold text-[#282828]">
                                    {quiz.correct.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#fff1f0] p-3 rounded-xl items-center justify-center border border-[#fce8e6] w-[47%] shadow-sm">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <XCircle weight="fill" size={14} color="#FF3B30" />
                                    <Text className="text-[#FF3B30] text-[11px] font-bold">{t("Wrong")}</Text>
                                </View>
                                <Text className="text-lg font-bold text-[#282828]">
                                    {quiz.wrong.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#f4f6f8] p-3 rounded-xl items-center justify-center border border-gray-200 w-[47%] shadow-sm">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <Question weight="regular" size={14} color="#6b7280" />
                                    <Text className="text-[#6b7280] text-[11px] font-bold">{t("Unanswered")}</Text>
                                </View>
                                <Text className="text-lg font-bold text-[#282828]">
                                    {quiz.unanswered.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#f0fcf5] p-3 rounded-xl items-center justify-center border border-[#d1f4e0] w-[47%] shadow-sm">
                                <View className="flex-row items-center gap-1 mb-1">
                                    <Question weight="regular" size={14} color="#43C17A" />
                                    <Text className="text-[#43C17A] text-[11px] font-bold">{t("Total Qs")}</Text>
                                </View>
                                <Text className="text-lg font-bold text-[#282828]">
                                    {quiz.total}
                                </Text>
                            </View>

                        </View>
                    </ScrollView>

                    <View className="px-5 py-4 border-t border-gray-100 flex-col gap-2 bg-gray-50/80 shrink-0">
                        {quiz.allAttemptsUsed ? (
                            <TouchableOpacity
                                onPress={onViewAnswers}
                                activeOpacity={0.8}
                                className="w-full bg-[#16284F] py-3 rounded-xl items-center justify-center shadow-sm"
                            >
                                <Text className="text-white text-sm font-bold">
                                    {t("View Answers")}
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            className="w-full bg-white border border-gray-300 py-3 rounded-xl items-center justify-center"
                        >
                            <Text className="text-gray-700 text-sm font-bold">
                                {t("Close")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
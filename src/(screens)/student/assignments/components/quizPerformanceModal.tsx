import React from "react";
import {
    View,
    Text,
    Modal,
    Image,
    ScrollView,
    TouchableOpacity,
} from "react-native";
import { CheckCircle, XCircle, Question, X } from "phosphor-react-native";
import { AttemptedQuizCard } from "./quizCard";
import { useTranslations } from "@/utils/useTranslations";
import { fonts } from "@/constants/fonts";

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

                <View className="bg-white rounded-[24px] w-full flex-col overflow-hidden" style={{ height: "80%" }}>
                    <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                        <Text className="text-xl text-[#182142]" style={{ fontFamily: fonts.bold }}>
                            {t("Performance Summary")}
                        </Text>
                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            className="p-2 bg-gray-100 rounded-full items-center justify-center"
                        >
                            <X size={20} color="#4b5563" weight="bold" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        className="flex-1 px-6 py-4"
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        <View className="mb-6">
                            <AttemptedQuizCard data={quiz} onOpenPerformanceModal={() => { }} />
                        </View>

                        <View className="items-center justify-center my-4">
                            <View className="w-[180px] h-[180px] items-center justify-center relative">
                                <Image
                                    source={require("../../../../../assets/result-circle.png")}
                                    className="w-full h-full"
                                    resizeMode="contain"
                                />

                                <View className="absolute items-center justify-center w-full">
                                    <Text 
                                        className="text-3xl text-[#A17A08] text-center" 
                                        style={{ fontFamily: fonts.bold }}
                                    >
                                        {quiz.score}
                                    </Text>
                                    <Text 
                                        className="text-lg text-[#182142] mt-0.5" 
                                        style={{ fontFamily: fonts.bold }}
                                    >
                                        {quiz.percentage}%
                                    </Text>
                                    <Text 
                                        className="text-xs text-gray-500 mt-0.5" 
                                        style={{ fontFamily: fonts.semiBold }}
                                    >
                                        {t("Quiz Score")}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="items-center mt-4 mb-6 px-4">
                            <Text 
                                className="text-lg text-[#1A1A1A] text-center leading-6" 
                                style={{ fontFamily: fonts.bold }}
                            >
                                {t("Good job! you performed well in this quiz")}
                            </Text>
                            <Text 
                                className="text-[13px] text-gray-500 mt-2 text-center" 
                                style={{ fontFamily: fonts.regular }}
                            >
                                {t("you answered {percent}% of question correctly", {
                                    percent: quiz.percentage.toString(),
                                })}
                            </Text>
                        </View>

                        <View className="flex-row flex-wrap gap-y-4 justify-between mb-6 w-full">
                            <View className="bg-[#f0fcf5] p-4 rounded-2xl items-center justify-center border border-[#d1f4e0] w-[48%] shadow-xs">
                                <View className="flex-row items-center gap-1.5 mb-2">
                                    <CheckCircle weight="fill" size={16} color="#43C17A" />
                                    <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                        {t("Correct Answers")}
                                    </Text>
                                </View>
                                <Text className="text-3xl text-gray-800" style={{ fontFamily: fonts.bold }}>
                                    {quiz.correct.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#fff1f0] p-4 rounded-2xl items-center justify-center border border-[#fce8e6] w-[48%] shadow-xs">
                                <View className="flex-row items-center gap-1.5 mb-2">
                                    <XCircle weight="fill" size={16} color="#FF3B30" />
                                    <Text className="text-[#FF3B30] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                        {t("Wrong Answers")}
                                    </Text>
                                </View>
                                <Text className="text-3xl text-gray-800" style={{ fontFamily: fonts.bold }}>
                                    {quiz.wrong.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#f0f4f8] p-4 rounded-2xl items-center justify-center border border-[#d9e2ec] w-[48%] shadow-xs">
                                <View className="flex-row items-center gap-1.5 mb-2">
                                    <Question weight="regular" size={16} color="#6b7280" />
                                    <Text className="text-[#6b7280] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                        {t("Unanswered")}
                                    </Text>
                                </View>
                                <Text className="text-3xl text-gray-800" style={{ fontFamily: fonts.bold }}>
                                    {quiz.unanswered.toString().padStart(2, "0")}
                                </Text>
                            </View>

                            <View className="bg-[#f0fcf5] p-4 rounded-2xl items-center justify-center border border-[#d1f4e0] w-[48%] shadow-xs">
                                <View className="flex-row items-center gap-1.5 mb-2">
                                    <Question weight="regular" size={16} color="#43C17A" />
                                    <Text className="text-[#43C17A] text-[11px]" style={{ fontFamily: fonts.bold }}>
                                        {t("Total Questions")}
                                    </Text>
                                </View>
                                <Text className="text-3xl text-gray-800" style={{ fontFamily: fonts.bold }}>
                                    {quiz.total.toString().padStart(2, "0")}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>

                    <View className="px-6 py-5 border-t border-gray-100 flex-col gap-3 bg-white shrink-0">
                        {quiz.allAttemptsUsed ? (
                            <TouchableOpacity
                                onPress={onViewAnswers}
                                activeOpacity={0.8}
                                className="w-full bg-[#16284F] py-3.5 rounded-xl items-center justify-center shadow-xs"
                            >
                                <Text className="text-white text-base" style={{ fontFamily: fonts.bold }}>
                                    {t("View Answers")}
                                </Text>
                            </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                            onPress={onClose}
                            activeOpacity={0.7}
                            className="w-full bg-white border border-gray-300 py-3.5 rounded-xl items-center justify-center"
                        >
                            <Text className="text-gray-700 text-base" style={{ fontFamily: fonts.bold }}>
                                {t("Close")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
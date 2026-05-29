import React, { useState } from "react";
import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";

type SubjectProgressCard = {
    title: string;
    professor: string;
    image: string;
    percentage: number;
    radialStart: string;
    radialEnd: string;
    remainingColor: string;
};

type SubjectProgressCardProps = {
    props: SubjectProgressCard[];
    onViewMore?: () => void;
    isLoading?: boolean;
    translations?: Record<string, string>;
};

const getSubjectInitials = (title: string) => {
    const parts = title.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "SU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

function SubjectCardRow({ subject }: { subject: SubjectProgressCard }) {
    const [imgError, setImgError] = useState(false);

    return (
        <View className="h-20 flex-row items-center rounded-lg p-2 gap-1 bg-[#E8F8EF] mb-2">
            <View className="h-full w-[20%] items-center justify-center overflow-hidden">
                {subject.image && !imgError ? (
                    <Image
                        source={{ uri: subject.image }}
                        className="h-12 w-12 rounded-md"
                        resizeMode="cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <View className="h-12 w-12 items-center justify-center rounded-md bg-[#BFEFCD]">
                        <Text className="text-[16px] font-semibold text-[#16284F]">
                            {getSubjectInitials(subject.title)}
                        </Text>
                    </View>
                )}
            </View>

            <View className="h-full w-[80%] p-2 flex-row justify-between items-center">
                <View className="flex-col gap-1 flex-1 pr-2">
                    <Text
                        className="text-[10px] font-semibold text-[#16284F]"
                        numberOfLines={2}
                    >
                        {subject.title}
                    </Text>
                    <Text className="text-[10px] text-[#454545]" numberOfLines={1}>
                        {subject.professor}
                    </Text>
                </View>

                <View className="w-[50px] h-[50px] items-center justify-center">
                    {/* <TinyDonut
              percentage={subject.percentage}
              width={50}
              height={50}
              radialStart={subject.radialStart}
              radialEnd={subject.radialEnd}
              remainingColor={subject.remainingColor}
            />
          */}
                    <Text className="text-[10px] font-bold text-[#16284F]">{subject.percentage}%</Text>
                </View>
            </View>
        </View>
    );
}

export default function SubjectProgressCards({
    props = [],
    onViewMore,
    isLoading,
    translations,
}: SubjectProgressCardProps) {
    const t = (key: string, fallback: string) => translations?.[key] || fallback;

    return (
        <View className="bg-white h-64 rounded-lg w-full p-4 shadow-sm border border-gray-100 flex-col">
            <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[#282828] font-semibold text-base">
                    {t("Subjects Progress", "Subjects Progress")}
                </Text>
                {onViewMore && (
                    <TouchableOpacity onPress={onViewMore} activeOpacity={0.6} className="p-1">
                        <Text className="text-black font-bold text-base">＞</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    [1, 2, 3].map((_, i) => (
                        <View
                            key={i}
                            className="h-20 flex-row items-center rounded-lg p-2 gap-1 bg-gray-100 opacity-60 mb-2"
                        >
                            <View className="h-12 w-[20%] rounded-md bg-gray-300" />
                            <View className="h-full w-[80%] p-2 flex-row justify-between items-center">
                                <View className="flex-col gap-2">
                                    <View className="h-2 w-24 bg-gray-300 rounded" />
                                    <View className="h-2 w-16 bg-gray-300 rounded" />
                                </View>
                                <View className="h-10 w-10 rounded-full bg-gray-300 mr-1" />
                            </View>
                        </View>
                    ))
                ) : props.length === 0 ? (
                    <View className="items-center justify-center py-10 opacity-70">
                        <Text className="text-[#282828] text-sm font-medium">
                            {t("No subjects yet !", "No subjects yet !")}
                        </Text>
                    </View>
                ) : (
                    props.map((subject, index) => (
                        <SubjectCardRow key={index} subject={subject} />
                    ))
                )}
            </ScrollView>
        </View>
    );
}
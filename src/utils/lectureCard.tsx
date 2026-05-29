import React from "react";
import { View, Text } from "react-native";

type LectureCardProps = {
    time: string;
    title: string;
    professor: string;
    description: string;
    status?: string;
};

export default function LectureCard({
    time,
    title,
    professor,
    description,
    status,
}: LectureCardProps) {
    const descriptionParts = description ? description.split(" • ") : [];
    const primaryDescription = descriptionParts[0] || "";

    return (
        <View className="flex-row gap-3 mb-2">
            <View className="w-[22%] items-center justify-start pt-1">
                <Text className="text-[12px] font-semibold text-[#16284F] text-left w-full">
                    {time}
                </Text>
            </View>

            <View className="w-[78%] bg-white rounded-md border-l-4 border-[#16284F] shadow-sm overflow-hidden">
                <View className="bg-[#E8E9ED] w-full px-3 py-2.5 gap-1.5">

                    <View className="flex-row items-center flex-wrap gap-2">
                        <Text className="text-[#16284F] text-[14px] font-semibold">
                            {title}
                        </Text>
                        <Text className="text-[#43C17A] text-[11px]">
                            ({professor})
                        </Text>
                    </View>

                    <Text className="text-[#454545] text-[12px] leading-snug">
                        {primaryDescription}
                    </Text>

                    {status ? (
                        <Text className="text-red-500 text-xs font-semibold mt-1">
                            {status}
                        </Text>
                    ) : null}
                </View>
            </View>
        </View>
    );
}
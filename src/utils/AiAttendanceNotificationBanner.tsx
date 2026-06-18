import { Text } from '@/components/AppText';
import React, { ReactNode } from "react";
import { View, Image } from 'react-native';
import { LinearGradient } from "expo-linear-gradient";

interface NotificationBannerProps {
    message: ReactNode;
    className?: string;
}

export default function AiAttendanceNotificationBanner({
    message,
    className = "",
}: NotificationBannerProps) {
    return (
        <LinearGradient
            colors={["#FBF5FD", "#CBB1FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 8 }}
            className={`flex-row w-full items-center px-4 py-3 relative min-h-[80px] shadow-sm ${className}`}
        >
            <View className="absolute -bottom-1 left-2 z-10">
                <Image
                    source={require("../../assets/ai-bot.png")}
                    className="h-16 w-16 md:h-22 md:w-25"
                    resizeMode="contain"
                />
            </View>

            <View className="ml-16 md:ml-28 flex-1 z-20">
                {typeof message === "string" ? (
                    <Text className="text-[#4A329A] text-xs md:text-sm font-medium leading-relaxed">
                        {message}
                    </Text>
                ) : (
                    message
                )}
            </View>
        </LinearGradient>
    );
}
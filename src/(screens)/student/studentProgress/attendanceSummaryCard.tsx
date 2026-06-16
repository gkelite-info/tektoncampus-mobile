import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { fonts } from "@/constants/fonts";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const useTranslations = (namespace: string) => {
    return (key: string) => key;
};

interface AttendanceSummaryProps {
    percentage: number;
    attendedCount?: number;
    conductedCount?: number;
}

export function AttendanceSummaryCard({ percentage, attendedCount, conductedCount }: AttendanceSummaryProps) {
    const t = useTranslations("Progress.student");

    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayedTextPercent, setDisplayedTextPercent] = React.useState(0);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: percentage / 100,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
        }).start();

        const listenerId = animatedValue.addListener(({ value }) => {
            setDisplayedTextPercent(Math.round(value * 100));
        });

        return () => {
            animatedValue.removeListener(listenerId);
        };
    }, [percentage]);

    const radius = 80;
    const circumference = Math.PI * radius;

    const strokeDashoffset = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
    });

    return (
        <View className="w-full bg-white rounded-2xl p-3">
            <Text className="text-[17px] text-[#333] mb-4 tracking-tight" style={{ fontFamily: fonts.semiBold }}>
                {t("Attendance Summary")}
            </Text>

            <View className="flex-col items-center justify-center ">
                <View className="w-full max-w-[240px] aspect-[2/1] relative items-center justify-end ">
                    <Svg
                        viewBox="0 0 200 100"
                        width="100%"
                        height="100%"
                        style={{ position: "absolute", top: -12, left: 0, overflow: "visible" }}
                    >
                        <Defs>
                            <LinearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0%" stopColor="#4ABF08" />
                                <Stop offset="100%" stopColor="#A1D683" />
                            </LinearGradient>
                        </Defs>

                        <Path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#D9F9C3"
                            strokeWidth="20"
                            strokeLinecap="round"
                        />

                        <AnimatedPath
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#gaugeGradient)"
                            strokeWidth="20"
                            strokeLinecap="round"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                        />
                    </Svg>

                    <View className="items-center justify-end pb-1 ">
                        <View className="flex-row items-baseline leading-none ">
                            <Text className="text-3xl text-[#2D3139] " style={{ fontFamily: fonts.bold }}>
                                {displayedTextPercent}
                            </Text>
                            <Text className="text-xl text-[#2D3139] ml-0.5" style={{ fontFamily: fonts.bold }}>%</Text>
                        </View>
                        <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.semiBold }}>
                            {t("Attendance")}
                        </Text>
                        {conductedCount !== undefined && conductedCount > 0 && (
                            <Text className="text-xs text-green-600 mt-1" style={{ fontFamily: fonts.medium }}>
                                {attendedCount} of {conductedCount} classes
                            </Text>
                        )}
                    </View>
                </View>

                <View className="flex-row gap-6 mt-6 mb-2">
                    <View className="flex-row items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-[#D9F9C3]" />
                        <Text className="text-xs text-gray-600" style={{ fontFamily: fonts.medium }}>
                            {t("Absent")}
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                        <View className="w-3 h-3 rounded-full bg-[#4ABF08]" />
                        <Text className="text-xs text-gray-600" style={{ fontFamily: fonts.medium }}>
                            {t("Present")}
                        </Text>
                    </View>
                </View>

            </View>
        </View>
    );
}
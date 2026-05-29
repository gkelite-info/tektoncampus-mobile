import { fonts } from "@/constants/fonts";
import { getStudentAcademicPerformance } from "@/lib/helpers/student/AcademicPerformance/calculations";
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import { BarChart } from "react-native-gifted-charts";

type AcademicPerformanceDatum = {
    subject: string;
    value: number;
    full: number;
};

interface AcademicPerformanceProps {
    studentId: number | null;
    data?: AcademicPerformanceDatum[];
    translations?: {
        calculating?: string;
        title?: string;
        failed?: string;
    };
}

export default function AcademicPerformance({
    studentId,
    data: externalData,
    translations,
}: AcademicPerformanceProps) {
    const [data, setData] = useState<AcademicPerformanceDatum[]>(externalData ?? []);
    const [loading, setLoading] = useState(!externalData);

    const tTitle = translations?.title || "Academic Performance";
    const tCalculating = translations?.calculating || "Calculating performance...";
    const tFailed = translations?.failed || "Failed to load performance";

    useEffect(() => {
        if (externalData) {
            setData(externalData);
            setLoading(false);
            return;
        }

        async function loadData() {
            try {
                const performance = await getStudentAcademicPerformance(studentId);
                setData(performance);
            } catch (err) {
                Alert.alert("Error", tFailed);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [studentId, externalData]);

    const chartData = data.map((item) => ({
        value: item.value,
        label: item.subject,
        frontColor: "#A8E089",
        gradientColor: "#9ACC7D",
        showGradient: true,
        topLabelComponent: () => (
            <View className="bg-[#E8F6E2] rounded-md px-1.5 py-0.5 mb-1 self-center">
                <Text className="text-[#7CD24C] text-[8px]" style={{ fontFamily: fonts.bold }}>
                    {item.value}%
                </Text>
            </View>
        ),
    }));

    if (loading) {
        return (
            <View className="h-60 justify-center items-center bg-white rounded-xl shadow-sm border border-gray-100">
                <ActivityIndicator size="small" color="#9ACC7D" />
                <Text className="mt-2.5 text-gray-400 text-sm" style={{ fontFamily: fonts.regular }}>{tCalculating}</Text>
            </View>
        );
    }

    return (
        <View className="w-full bg-white rounded-xl py-5 px-2.5 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-center px-2.5 mb-6">
                <Text className="text-[17px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>
                    {tTitle}
                </Text>
            </View>

            <View className="items-center justify-center pl-1">
                <BarChart
                    data={chartData}
                    barWidth={32}
                    spacing={24}
                    roundedTop
                    roundedBottom
                    noOfSections={4}
                    maxValue={100}
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor="#E5E7EB"
                    yAxisTextStyle={{ fontSize: 10, color: "#888888" }}
                    xAxisLabelTextStyle={{ fontSize: 9.5, color: "#282828", fontWeight: "600", textAlign: "center" }}
                    yAxisLabelSuffix="%"
                    isAnimated
                    showReferenceLine1
                    referenceLine1Position={100}
                    referenceLine1Config={{
                        color: "rgba(233, 245, 230, 0.4)",
                        dashWidth: 0,
                        thickness: 2,
                    }}
                />
            </View>
        </View>
    );
}
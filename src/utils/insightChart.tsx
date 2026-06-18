import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
const useTranslations = (namespace: string) => {
  return (key: string, options?: any) => {
    if (options?.value !== undefined) return key.replace("{value}", options.value);
    return key;
  };
};
interface AttendanceInsightProps {
  weeklyData?: number[];
}
export default function AttendanceInsight({
  weeklyData = [80, 70, 90, 50, 30, 85, 62]
}: AttendanceInsightProps) {
  const {
    t
  } = useTranslation();
  const days = ["M", "TU", "W", "TH", "F", "S"];
  const barData = days.map((day, index) => {
    const val = weeklyData[index] || 0;
    return {
      value: val,
      label: day,
      topLabelComponent: () => <Text style={{
        fontSize: 9,
        color: '#43C17A',
        marginBottom: 2,
        fontWeight: '500'
      }}>
                    {val}%
                </Text>
    };
  });
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 96;
  return <View className="bg-white rounded-xl p-4 shadow-sm w-full">
            <Text className="text-[#282828] font-semibold text-lg mb-4">
                {t("Attendance Insight")}
            </Text>

            <View className="w-full items-center justify-center pt-2 h-[260px]">
                <BarChart data={barData} barWidth={14} spacing={22} initialSpacing={10} width={chartWidth} height={200} maxValue={100} noOfSections={5} stepValue={20} hideRules hideYAxisText={false} xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={{
        fontSize: 12,
        color: "#666"
      }} xAxisLabelTextStyle={{
        fontSize: 12,
        color: "#666",
        textAlign: 'center'
      }} yAxisLabelSuffix="%" yAxisLabelWidth={38} isAnimated barBorderTopLeftRadius={6} barBorderTopRightRadius={6} showGradient gradientColor="#43C17A" frontColor="#205B3A" />
            </View>
        </View>;
}
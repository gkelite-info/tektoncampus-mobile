import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { FC } from "react";
import { View, Dimensions } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { fonts } from "@/constants/fonts";
import { ChartDataPoint } from "../types";

interface Props {
  data?: ChartDataPoint[];
}

const mockChartData: ChartDataPoint[] = [
{ month: "Jan", performance: 71, attendance: 10 },
{ month: "Feb", performance: 96, attendance: 15 },
{ month: "Mar", performance: 100, attendance: 18 },
{ month: "Apr", performance: 40, attendance: 14 },
{ month: "May", performance: 35, attendance: 23 },
{ month: "Jun", performance: 42, attendance: 14 },
{ month: "Jul", performance: 47, attendance: 32 }];


const AttendancePerformanceChart: FC<Props> = ({ data }) => {const { t } = useTranslation();
  const chartData = data ?? mockChartData;

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 70;

  const performanceData = chartData.map((d) => ({
    value: d.performance,
    label: d.month
  }));

  const attendanceData = chartData.map((d) => ({
    value: d.attendance
  }));

  return (
    <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 w-full">
      <Text className="text-[#282828] text-[15px] mb-6" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AttendancePerfo", "Attendance & Performance Trend")}

      </Text>

      <View className="items-center">
        <LineChart
          data={performanceData}
          data2={attendanceData}
          width={chartWidth}
          height={220}
          maxValue={100}
          noOfSections={5}
          stepValue={20}
          yAxisLabelTexts={["0%", "20%", "40%", "60%", "80%", "100%"]}
          yAxisTextStyle={{ color: "#6B7280", fontSize: 10, fontFamily: fonts.regular }}
          xAxisLabelTextStyle={{ color: "#6B7280", fontSize: 10, fontFamily: fonts.regular }}
          color1="#1E293B"
          color2="#43C17A"
          dataPointsColor1="#1E293B"
          dataPointsColor2="#43C17A"
          thickness={2.5}
          hideDataPoints={true}
          hideRules
          yAxisColor="#E5E7EB"
          xAxisColor="#E5E7EB"
          yAxisThickness={0}
          xAxisThickness={1}
          pointerConfig={{
            pointerStripHeight: 220,
            pointerStripColor: 'lightgray',
            pointerStripWidth: 2,
            pointerColor: 'lightgray',
            radius: 6,
            pointerLabelWidth: 100,
            pointerLabelHeight: 90,
            activatePointersOnLongPress: true,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              return (
                <View className="bg-white p-2 rounded-lg shadow border border-gray-100">
                  <Text className="text-gray-700 text-[10px]" style={{ fontFamily: fonts.bold }}>
                    {items[0].label}
                  </Text>
                  <Text className="text-[#1E293B] text-[10px] mt-1" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Performance", "Performance:")}
                    {items[0].value}%
                  </Text>
                  <Text className="text-[#43C17A] text-[10px] mt-1" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Attendance", "Attendance:")}
                    {items[1].value}
                  </Text>
                </View>);

            }
          }} />
        
      </View>

      <View className="flex-row justify-center items-center mt-6">
        <View className="flex-row items-center mr-6">
          <View className="w-3 h-3 rounded-full bg-[#1E293B] mr-2" />
          <Text className="text-[13px] text-gray-700" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Performance", "Performance")}</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#43C17A] mr-2" />
          <Text className="text-[13px] text-gray-700" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Attendance", "Attendance")}</Text>
        </View>
      </View>
    </View>);

};

export default AttendancePerformanceChart;
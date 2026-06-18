import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, Dimensions } from 'react-native';
import { BarChart } from "react-native-gifted-charts";
import tw from "twrnc";

type AcademicPerformanceItem = {
  subject: string;
  value: number;
  full: number;
};

interface AcademicPerformanceProps {
  data?: AcademicPerformanceItem[];
}

export default function AcademicPerformanceChart({
  data
}: AcademicPerformanceProps) {const { t } = useTranslation();
  const screenWidth = Dimensions.get("window").width;

  const chartData = data && data.length > 0 ?
  data.map((item) => ({
    value: item.value || 0,
    label: item.subject,
    frontColor: "#8CCB72",
    topLabelComponent: () => {
      if (!item.value && item.value !== 0) return null;
      return (
        <View style={tw`bg-[#E8F6E2] rounded-full px-2 py-1 -mt-6 items-center justify-center opacity-95`}>
              <Text style={tw`text-[#6DB951] text-[8px] font-bold`}>{`${Math.round(item.value)}%`}</Text>
            </View>);

    }
  })) :
  [{ value: 0, label: "N/A", frontColor: "#8CCB72" }];

  return (
    <View style={tw`w-full flex-col rounded-xl bg-white p-4 lg:p-5 shadow-sm border border-gray-100 min-h-[300px]`}>
      <Text style={tw`mb-4 text-lg font-bold text-[#282828]`}>{t("Auto.Common.AcademicPerform", "Academic Performance")}

      </Text>

      <View style={tw`flex-1 w-full mt-2 items-center justify-center`}>
        <BarChart
          data={chartData}
          width={screenWidth - 100}
          height={220}
          barWidth={32}
          spacing={24}
          roundedTop
          roundedBottom
          xAxisThickness={0}
          yAxisThickness={0}
          yAxisTextStyle={{ color: "#888", fontSize: 10, fontWeight: "500" }}
          xAxisLabelTextStyle={{ color: "#444", fontSize: 10, fontWeight: "600" }}
          noOfSections={4}
          maxValue={100}
          yAxisLabelSuffix="%"
          isAnimated
          showGradient
          gradientColor="#A8E089"
          showFractionalValues={false}
          hideRules />
        
      </View>
    </View>);

}
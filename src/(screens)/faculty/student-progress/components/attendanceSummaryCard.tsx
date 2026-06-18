import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View } from 'react-native';
import { PieChart } from "react-native-gifted-charts";
import tw from "twrnc";

interface AttendanceSummaryProps {
  percentage: number;
}

export default function AttendanceSummaryCard({
  percentage
}: AttendanceSummaryProps) {const { t } = useTranslation();

  const chartData = [
  { value: percentage, color: "#4ABF08" },
  { value: 100 - percentage, color: "#D9F9C3" }];


  return (
    <View style={tw`bg-white shadow-sm p-4 md:p-6 rounded-xl border border-gray-100 w-full h-full flex-col min-h-[300px]`}>
      <Text style={tw`text-[16px] md:text-lg font-bold text-[#333] mb-4 tracking-tight`}>{t("Auto.Common.AttendanceSumma", "Attendance Summary")}

      </Text>

      <View style={tw`flex-1 items-center justify-center`}>
        <View style={tw`items-center`}>
          <PieChart
            donut
            semiCircle
            radius={100}
            innerRadius={75}
            data={chartData}
            backgroundColor="transparent" />
          
          <View style={tw`absolute bottom-120 items-center justify-end`}>
            <View style={tw`flex-row items-baseline`}>
              <Text style={tw`text-2xl md:text-3xl font-black text-[#2D3139]`}>
                {Math.round(percentage)}
              </Text>
              <Text style={tw`text-xl md:text-2xl font-bold text-[#2D3139]`}>
                %
              </Text>
            </View>
            <Text style={tw`text-xs md:text-sm font-bold text-[#888] mt-1 uppercase tracking-widest`}>{t("Auto.Common.Attendance", "Attendance")}

            </Text>
          </View>
        </View>

        <View style={tw`flex-row gap-6 md:gap-10 mt-6 md:mt-8`}>
          <View style={tw`flex-row items-center gap-2 md:gap-3`}>
            <View style={tw`w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#D9F9C3]`} />
            <Text style={tw`text-[13px] md:text-[15px] font-bold text-gray-600`}>{t("Auto.Common.Absent", "Absent")}

            </Text>
          </View>
          <View style={tw`flex-row items-center gap-2 md:gap-3`}>
            <View style={tw`w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#4ABF08]`} />
            <Text style={tw`text-[13px] md:text-[15px] font-bold text-gray-600`}>{t("Auto.Common.Present", "Present")}

            </Text>
          </View>
        </View>
      </View>
    </View>);

}
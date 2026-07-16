import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React from "react";
import { View, ScrollView } from 'react-native';
import tw from "twrnc";

export interface GradeEntry {
  subject: string;
  grade: string;
  improvement: "Improved" | "Declining" | string;
}

interface GradesTableProps {
  grades?: GradeEntry[];
}

export default function GradesTable({ grades }: GradesTableProps) {
  const { t } = useTranslation();
  const defaultGrades: GradeEntry[] = [
    { subject: "Java Programming", grade: "A", improvement: "Improved" },
    { subject: "Data Structures", grade: "B", improvement: "Declining" },
    { subject: "Database Management", grade: "A", improvement: "Improved" },
    { subject: "Operating Systems", grade: "A", improvement: "Improved" },
    { subject: "Web Development", grade: "B", improvement: "Declining" }
  ];

  const tableGrades = grades?.length ? grades : defaultGrades;

  return (
    <View style={tw`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 w-full h-full flex-col min-h-[300px]`}>
      <Text style={[{ fontFamily: fonts.bold }, tw`text-[#333333] text-[16px] md:text-xl mb-4 md:mb-6`]}>{t("Auto.Common.Grades", "Grades")}
      </Text>
      
      <View style={tw`w-full flex-1`}>
        {tableGrades.length > 0 ?
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-1`}>
            <View style={tw`w-full min-w-[320px]`}>
              {/* Header */}
              <View style={tw`flex-row border-b border-gray-100 pb-2`}>
                <Text style={[{ fontFamily: fonts.medium }, tw`flex-1 text-[12px] md:text-sm text-[#8E8E8E]`]}>{t("Auto.Common.Subject", "Subject")}</Text>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-16 text-[12px] md:text-sm text-[#8E8E8E]`]}>{t("Auto.Common.Grade", "Grade")}</Text>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-24 text-[12px] md:text-sm text-[#8E8E8E] text-right`]}>{t("Auto.Common.Improvement", "Improvement")}</Text>
              </View>

              <View style={tw`flex-1`}>
                {tableGrades.map((item, idx) =>
              <View
                key={`${item.subject}-${item.grade}-${idx}`}
                style={tw`flex-row items-center border-b border-gray-50 py-3 md:py-4`}>
                
                    <Text style={[{ fontFamily: fonts.medium }, tw`flex-1 text-[12px] md:text-sm text-[#333333] pr-2`]} numberOfLines={2}>
                      {item.subject}
                    </Text>
                    <Text style={[{ fontFamily: fonts.bold }, tw`w-16 text-[12px] md:text-sm text-[#333333]`]}>
                      {item.grade}
                    </Text>
                    <Text
                      style={[{ fontFamily: fonts.medium }, tw`w-24 text-[12px] md:text-sm text-right ${
                        item.improvement === "Improved" ? "text-[#4CAF50]" : "text-[#FF3B30]"
                      }`]}
                    >
                      {item.improvement}
                    </Text>
                  </View>
              )}
              </View>
            </View>
          </ScrollView> :

        <View style={tw`flex-1 items-center justify-center py-8`}>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-[13px] md:text-sm text-[#6B7280] text-center`]}>{t("Auto.Common.Nogradesavailab", "No grades available for this student.")}
          </Text>
          </View>
        }
      </View>
    </View>);
}
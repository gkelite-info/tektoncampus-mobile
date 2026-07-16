import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import tw from "twrnc";

export type Assignment = {
  subject: string;
  task: string;
  dueDate: string;
  status: "Pending" | "Incomplete" | "Completed" | string;
  obtainedMarks?: number;
  totalMarks?: number;
};

export type Quiz = {
  subject: string;
  task: string;
  dueDate: string;
  status: "Not Attempted" | "Attempted" | "Evaluated" | string;
  obtainedMarks?: number;
  totalMarks?: number;
};

export type Discussion = {
  subject: string;
  task: string;
  dueDate: string;
  status: "Not Submitted" | "Submitted" | "Evaluated" | string;
  obtainedMarks?: number;
  totalMarks?: number;
};

type TaskTab = "assignments" | "quizzes" | "discussions";

interface AssignmentsTableProps {
  assignments?: Assignment[];
  quizzes?: Quiz[];
  discussions?: Discussion[];
  weightages?: {
    assignments: number;
    quizzes: number;
    discussions: number;
  };
  insights?: {
    assignments: {obtained: number;total: number;weightedScore: number;};
    quizzes: {obtained: number;total: number;weightedScore: number;};
    discussions: {obtained: number;total: number;weightedScore: number;};
  };
}

const TAB_LABELS: Record<TaskTab, string> = {
  assignments: "Assignments",
  quizzes: "Quizzes",
  discussions: "Discussion Forum"
};

const EMPTY_MESSAGES: Record<TaskTab, string> = {
  assignments: "No assignments available for this student.",
  quizzes: "No quizzes available for this student.",
  discussions: "No discussion forums available for this student."
};

const getStatusColor = (status: string) => {
  if (status === "Pending" || status === "Not Attempted" || status === "Not Submitted") {
    return "text-[#FF3B30]";
  }
  if (status === "Incomplete" || status === "Attempted" || status === "Submitted") {
    return "text-[#F59E0B]";
  }
  return "text-[#4CAF50]";
};

export default function AssignmentsTable({
  assignments = [],
  quizzes = [],
  discussions = [],
  weightages,
  insights
}: AssignmentsTableProps) {const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TaskTab>("assignments");

  const rows = useMemo(() => {
    if (activeTab === "quizzes") return quizzes;
    if (activeTab === "discussions") return discussions;
    return assignments;
  }, [activeTab, assignments, discussions, quizzes]);

  const activeWeightage = useMemo(() => {
    if (activeTab === "quizzes") return weightages?.quizzes ?? 0;
    if (activeTab === "discussions") return weightages?.discussions ?? 0;
    return weightages?.assignments ?? 0;
  }, [activeTab, weightages]);

  const activeInsight = useMemo(() => {
    if (activeTab === "quizzes") {
      return insights?.quizzes ?? { obtained: 0, total: 0, weightedScore: 0 };
    }
    if (activeTab === "discussions") {
      return insights?.discussions ?? { obtained: 0, total: 0, weightedScore: 0 };
    }
    return insights?.assignments ?? { obtained: 0, total: 0, weightedScore: 0 };
  }, [activeTab, insights]);

  const derivedInsight = useMemo(() => {
    const aggregated = rows.reduce(
      (acc, item) => {
        acc.obtained += item.obtainedMarks ?? 0;
        acc.total += item.totalMarks ?? 0;
        return acc;
      },
      { obtained: 0, total: 0 }
    );
    const weightedScore =
    aggregated.total > 0 && activeWeightage > 0 ?
    Math.round(aggregated.obtained / aggregated.total * activeWeightage) :
    0;

    return {
      obtained: aggregated.obtained,
      total: aggregated.total,
      weightedScore
    };
  }, [activeWeightage, rows]);

  const displayInsight = derivedInsight.total > 0 || derivedInsight.obtained > 0 ? derivedInsight : activeInsight;

  return (
    <View style={tw`w-full rounded-xl bg-white p-4 lg:p-6 shadow-sm border border-gray-100 flex-col min-h-[350px]`}>
      <View style={tw`mb-4 space-y-4`}>
        <View style={tw`flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
          <Text style={[{ fontFamily: fonts.bold }, tw`text-[16px] md:text-xl  text-[#333333]`]}>{t("Auto.Common.AcademicTasks", "Academic Tasks")}

          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
            <View style={tw`flex-row items-center gap-2 px-1 pb-1`}>
              {(Object.keys(TAB_LABELS) as TaskTab[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={tw`rounded-full px-3 md:px-4 py-1.5 ${
                    isActive ? "bg-[#43C17A]/10" : "bg-[#F3F4F6]"}`
                    }>
                    
                    <Text
                      style={[{ fontFamily: fonts.semiBold }, tw`text-[11px] md:text-xs  ${
                      isActive ? "text-[#43C17A]" : "text-[#6B7280]"}`]}
                      >
                      
                      {TAB_LABELS[tab]}
                    </Text>
                  </TouchableOpacity>);

              })}
            </View>
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`-mx-1`}>
          <View style={tw`flex-row items-center gap-2 px-1 pb-1`}>
            <View style={tw`flex-row items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl bg-[#F8FBF9] px-2.5 md:px-3 py-1.5 md:py-2`}>
              <Text style={[{ fontFamily: fonts.semiBold }, tw`text-[9px] md:text-[11px]  uppercase tracking-widest text-[#8E8E8E]`]}>{t("Auto.Common.Weightage", "Weightage")}

              </Text>
              <View style={tw`rounded-full bg-[#43C17A]/10 px-2 md:px-3 py-0.5 md:py-1`}>
                <Text style={[{ fontFamily: fonts.bold }, tw`text-xs md:text-sm  text-[#43C17A]`]}>
                  {activeWeightage}%
                </Text>
              </View>
            </View>
            
            <View style={tw`flex-row items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl bg-[#FFF7ED] px-2.5 md:px-3 py-1.5 md:py-2`}>
              <Text style={[{ fontFamily: fonts.semiBold }, tw`text-[9px] md:text-[11px]  uppercase tracking-widest text-[#B45309]`]}>{t("Auto.Common.Marks", "Marks")}

              </Text>
              <View style={tw`rounded-full bg-[#FFEDD5] px-2 md:px-3 py-0.5 md:py-1`}>
                <Text style={[{ fontFamily: fonts.bold }, tw`text-xs md:text-sm  text-[#D97706]`]}>
                  {displayInsight.obtained}/{displayInsight.total}
                </Text>
              </View>
            </View>
            
            <View style={tw`flex-row items-center gap-1.5 md:gap-2 rounded-xl md:rounded-2xl bg-[#EEF6FF] px-2.5 md:px-3 py-1.5 md:py-2`}>
              <Text style={[{ fontFamily: fonts.semiBold }, tw`text-[9px] md:text-[11px]  uppercase tracking-widest text-[#4B5563]`]}>{t("Auto.Common.Added", "Added")}

              </Text>
              <View style={tw`rounded-full bg-[#DBEAFE] px-2 md:px-3 py-0.5 md:py-1`}>
                <Text style={[{ fontFamily: fonts.bold }, tw`text-xs md:text-sm  text-[#2563EB]`]}>
                  {displayInsight.weightedScore}%
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <View style={tw`flex-1 w-full`}>
        {rows.length > 0 ?
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`flex-1`}>
            <View style={tw`min-w-[600px] w-full`}>
              {}
              <View style={tw`flex-row border-b border-gray-100 pb-2`}>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-[30%] text-[12px] md:text-sm  text-[#8E8E8E]`]}>{t("Auto.Common.Subject", "Subject")}</Text>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-[35%] text-[12px] md:text-sm  text-[#8E8E8E]`]}>{t("Auto.Common.Task", "Task")}</Text>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-[20%] text-[12px] md:text-sm  text-[#8E8E8E]`]}>{t("Auto.Common.DueDate", "Due Date")}</Text>
                <Text style={[{ fontFamily: fonts.medium }, tw`w-[15%] text-[12px] md:text-sm  text-[#8E8E8E] text-right`]}>{t("Auto.Common.Status", "Status")}</Text>
              </View>

              {}
              <View style={tw`flex-1`}>
                {rows.map((item, idx) =>
              <View
                key={`${activeTab}-${item.subject}-${item.task}-${idx}`}
                style={tw`flex-row items-center border-b border-gray-50 py-3 md:py-4`}>
                
                    <Text style={[{ fontFamily: fonts.medium }, tw`w-[30%] text-[12px] md:text-sm  text-[#333333] pr-2`]} numberOfLines={2}>
                      {item.subject}
                    </Text>
                    <Text style={[{ fontFamily: fonts.regular }, tw`w-[35%] text-[12px] md:text-sm text-[#666666] pr-2`]} numberOfLines={2}>
                      {item.task}
                    </Text>
                    <Text style={[{ fontFamily: fonts.regular }, tw`w-[20%] text-[12px] md:text-sm text-[#666666] pr-2`]} numberOfLines={1}>
                      {item.dueDate}
                    </Text>
                    <Text style={[{ fontFamily: fonts.medium }, tw`w-[15%] text-[12px] md:text-sm  text-right ${getStatusColor(item.status)}`]} numberOfLines={1}>
                      {item.status}
                    </Text>
                  </View>
              )}
              </View>
            </View>
          </ScrollView> :

        <View style={tw`flex-1 items-center justify-center h-[200px] md:h-[250px] px-4`}>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-xs md:text-sm text-[#6B7280] text-center`]}>
              {EMPTY_MESSAGES[activeTab]}
            </Text>
          </View>
        }
      </View>
    </View>);

}
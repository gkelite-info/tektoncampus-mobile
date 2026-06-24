import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, CheckCircle, FilePdf, UserCircle, CaretDown, Clock } from "phosphor-react-native";
import { CardProps, UnitTopic } from "./subjectCard";
import { TopicPdfViewModal } from "./TopicPdfViewModal";
import { fonts } from "@/constants/fonts";
const useTranslations = (namespace: string) => {
  return (key: string) => {
    if (key === "Sem") return "Sem";
    return key;
  };
};
const colorMap = {
  purple: {
    cardBg: "bg-[#E9E3FF]",
    dot: "bg-[#A66BFF]",
    title: "text-[#3B2A91]",
    accent: "text-[#7E5DFF]",
    solidEnd: "#7E5DFF"
  },
  orange: {
    cardBg: "bg-[#FFEDDA]",
    dot: "bg-[#FFAE4C]",
    title: "text-[#A35300]",
    accent: "text-[#FF8A2A]",
    solidEnd: "#FF8A2A"
  },
  blue: {
    cardBg: "bg-[#CEE6FF]",
    dot: "bg-[#68A4FF]",
    title: "text-[#22518F]",
    accent: "text-[#4C8DFF]",
    solidEnd: "#4C8DFF"
  }
} as const;
type FilterBannerProps = {
  filterBannerDetails: CardProps;
};
function FilterBanner({
  filterBannerDetails
}: FilterBannerProps) {
  const {
    t
  } = useTranslation();
  return <View className="flex-col gap-2">
            <View className="flex-row flex-wrap gap-2">
                <View className="flex-row items-center gap-2 mr-2">
                    <Text className="text-[#525252] text-base" style={{
          fontFamily: fonts.regular
        }}>
                        {t("Subject :")}
                    </Text>
                    <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
                        <Text className="text-[#43C17A] text-base" style={{
            fontFamily: fonts.medium
          }}>
                            {filterBannerDetails.subjectTitle}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <Text className="text-[#525252] text-base" style={{
          fontFamily: fonts.regular
        }}>
                        {t("Semester :")}
                    </Text>
                    <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
                        <Text className="text-[#43C17A] text-base" style={{
            fontFamily: fonts.medium
          }}>
                            {filterBannerDetails.semester ? `${t("Sem")} ${filterBannerDetails.semester}` : "N/A"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>;
}
type UnitCardProps = {
  unit: NonNullable<CardProps["unitsData"]>[number];
  onOpenTopicPdf: (payload: {
    unitLabel: string;
    unitTitle: string;
    topicId: number;
    topicTitle: string;
  }) => void;
};
function UnitCard({
  unit,
  onOpenTopicPdf
}: UnitCardProps) {
  const {
    t
  } = useTranslation();
  const colors = colorMap[unit.color] || colorMap.purple;
  const percentage = unit.percentage ?? 0;
  const [isExpanded, setIsExpanded] = useState(false);
  const renderTopicList = (topics: UnitTopic[]) => {
    
    if (topics.length === 0) {
      return <Text className="text-gray-400 text-xs" style={{
        fontFamily: fonts.italic
      }}>{t("No topics found")}</Text>;
    }
    return topics.map((topic: UnitTopic) => <View key={topic.topicId} className="flex-row items-start justify-between gap-2 py-1">
                <View className="flex-row items-start gap-2 flex-1">
                    <CheckCircle size={16} color={colors.solidEnd} weight={topic.isCompleted ? "fill" : "regular"} style={{
          marginTop: 2
        }} />
        
                    <Text className={`text-xs text-[#3F3F3F] flex-1 ${topic.isCompleted ? "text-gray-400 line-through" : ""}`} style={{
          fontFamily: fonts.regular
        }}>
                        {topic.name}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => onOpenTopicPdf({
        unitLabel: unit.unitLabel,
        unitTitle: unit.title,
        topicId: topic.topicId,
        topicTitle: topic.name
      })}>
        
                    <FilePdf size={18} color={colors.solidEnd} weight="duotone" />
                </TouchableOpacity>
            </View>);
  };
  return <View className={`rounded-2xl p-4 ${colors.cardBg} w-full mb-4`}>
            <TouchableOpacity className="flex-row items-center justify-between mb-2" onPress={() => setIsExpanded(!isExpanded)}>
        
                <View className="flex-row items-center gap-2">
                    <View className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                    <Text className={`text-base ${colors.title}`} style={{
          fontFamily: fonts.bold
        }}>
                        {unit.unitLabel}
                    </Text>
                </View>
                <CaretDown size={16} color={colors.solidEnd} weight="bold" style={{
        transform: [{
          rotate: isExpanded ? "180deg" : "0deg"
        }]
      }} />
        
            </TouchableOpacity>

            <View className="bg-white rounded-xl p-3 flex-col">
                <Text className={`text-base mb-2 ${colors.title}`} style={{
        fontFamily: fonts.bold
      }}>
                    {unit.title}
                </Text>

                <View className="w-full h-2 rounded-full bg-gray-200 overflow-hidden relative my-2">
                    <View className="h-full rounded-full" style={{
          width: `${percentage}%`,
          backgroundColor: colors.solidEnd
        }} />
          
                </View>

                <View className="flex-row items-center justify-end mt-1 mb-2">
                    {}
                    <Text className={`text-base ${colors.title}`} style={{
          fontFamily: fonts.bold
        }}>
                        {percentage}%
                    </Text>
                </View>

                {isExpanded && <View className="border-t border-gray-100 pt-2 mt-2 flex-col gap-1">
                        {renderTopicList(unit.topics)}
                    </View>}
            </View>
        </View>;
}
export function SubjectDetailsCard({
  details,
  onBack
}: {
  details: CardProps;
  onBack: () => void;
}) {
  const {
    t
  } = useTranslation();
  const dynamicUnits = details.unitsData || [];
  const [selectedTopicPdf, setSelectedTopicPdf] = useState<{
    unitLabel: string;
    unitTitle: string;
    topicId: number;
    topicTitle: string;
  } | null>(null);
  return <ScrollView className="w-full p-1 bg-[#F5F5F7]" showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={onBack} className="mb-4 flex-row items-center gap-2">
        
                <ArrowLeft size={16} color="#7153E1" weight="bold" />
                <Text className="text-[#7153E1] text-sm" style={{
        fontFamily: fonts.bold
      }}>
                    {t("Go Back")}
                </Text>
            </TouchableOpacity>

            <View className="flex-col gap-3 mb-4">
                <FilterBanner filterBannerDetails={details} />

                <View className="flex-row items-center gap-2 bg-[#E8ECF3] px-3 py-1.5 rounded-full self-start">
                    <UserCircle size={18} color="#122A5E" weight="fill" />
                    <Text className="text-[#4C4C4C] text-base" style={{
          fontFamily: fonts.medium
        }}>
                        {t("Faculty :")}{" "}
                    </Text>
                    <Text className="text-[#122A5E] text-base" style={{
          fontFamily: fonts.bold
        }}>
                        {details.lecturer}
                    </Text>
                </View>
            </View>

            <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-[#BBF7D0] bg-[#ECFDF5] p-3 shadow-sm">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
                    <FilePdf size={20} color="#16A34A" weight="duotone" />
                </View>
                <View className="flex-1">
                    <Text className="text-base text-[#14532D]" style={{
          fontFamily: fonts.bold
        }}>{t("Auto.Common.AIGeneratedNote", "AI Generated Notes")}

          </Text>
                    <Text className="text-sm text-[#4B5563] mt-0.5" style={{
          fontFamily: fonts.medium
        }}>{t("Auto.Common.TopicwisePDFsar", "Topic-wise PDFs are generated along with the notes for quick study.")}

          </Text>
                </View>
            </View>

            <View className="flex-col w-full mb-10">
                {dynamicUnits.map(unit => <UnitCard key={unit.id} unit={unit} onOpenTopicPdf={setSelectedTopicPdf} />)}
                {dynamicUnits.length === 0 && <Text className="text-gray-500 p-4 text-center text-base" style={{
        fontFamily: fonts.italic
      }}>
                        {t("No units found")}
                    </Text>}
            </View>

            <TopicPdfViewModal isOpen={!!selectedTopicPdf} onClose={() => setSelectedTopicPdf(null)} unitLabel={selectedTopicPdf?.unitLabel ?? ""} unitTitle={selectedTopicPdf?.unitTitle ?? ""} topicTitle={selectedTopicPdf?.topicTitle ?? ""} topicId={selectedTopicPdf?.topicId ?? 0} />
      
        </ScrollView>;
}
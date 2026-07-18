import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { CaretDown } from "phosphor-react-native";
import { SubjectDetailsCard } from "./subjectDetails";
import { Avatar } from "@/utils/Avatar";
import { useStudent } from "@/utils/context/student/useStudent";
import { fonts } from "@/constants/fonts";
import { isSchoolEducation } from '@/lib/helpers/admin/academicSetup/schoolHelper';
const useTranslations = (namespace: string) => {
  return (key: string, variables?: any) => {
    if (variables?.subject) return `No subjects found for ${variables.subject}`;
    return key;
  };
};
export type UnitTopic = {
  topicId: number;
  name: string;
  isCompleted: boolean;
  displayOrder: number;
};
export type CardProps = {
  profileIcon: string;
  subjectTitle: string;
  subjectCredits: number;
  lecturer: string;
  units: number;
  topicsCovered: number;
  topicsTotal: number;
  nextLesson: string;
  percentage?: number;
  fromDate: string;
  toDate: string;
  semester?: number;
  academicYear?: string;
  unitsData?: {
    id: number;
    unitLabel: string;
    title: string;
    color: "purple" | "orange" | "blue";
    dateRange: string;
    percentage: number;
    topics: UnitTopic[];
  }[];
};
type SubjectCardProps = {
  subjectProps: CardProps[];
};
export default function SubjectCard({
  subjectProps
}: SubjectCardProps) {
  const {
    t
  } = useTranslation();
  const {
    collegeEducationType
  } = useStudent();
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [dropdownVisible, setDropdownVisible] = useState<boolean>(false);
  const [activeSubjectTitle, setActiveSubjectTitle] = useState<string | null>(null);
  const ballSize = 10;
  const activeSubjectData = useMemo(() => {
    return activeSubjectTitle ? subjectProps.find(s => s.subjectTitle === activeSubjectTitle) : null;
  }, [activeSubjectTitle, subjectProps]);
  const handleViewDetails = (title: string) => {
    setActiveSubjectTitle(title);
  };
  const handleBack = () => {
    setActiveSubjectTitle(null);
  };
  const filteredSubjects = useMemo(() => {
    let result = subjectProps;
    if (selectedSubject !== "All") {
      result = subjectProps.filter(s => s.subjectTitle === selectedSubject);
    }
    return result;
  }, [subjectProps, selectedSubject]);
  const uniqueSubjects = useMemo(() => {
    const titles = new Set(subjectProps.map(s => s.subjectTitle));
    return ["All", ...Array.from(titles)];
  }, [subjectProps]);
  if (activeSubjectData) {
    return <View className="w-full">
      <SubjectDetailsCard details={activeSubjectData} onBack={handleBack} />
    </View>;
  }
  return <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
    <View className="mb-4 flex-col gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="w-full flex-row py-2">
        <View className="flex-row items-center gap-2 mr-4">
          <Text className="text-[#525252] text-base font-medium">
            {t("Academics.student.Subject", "Subject :")}
          </Text>
          <TouchableOpacity onPress={() => setDropdownVisible(true)} className="px-3 py-1 bg-[#DCEAE2] rounded-full flex-row items-center justify-between" style={{
            maxWidth: 150
          }}>

            <Text className="text-[#43C17A] text-base truncate" numberOfLines={1} style={{
              fontFamily: fonts.medium
            }}>
              {selectedSubject === "All" ? t("Academics.student.All", "All") : selectedSubject}
            </Text>
            <CaretDown size={12} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </View>

        {!(collegeEducationType === "Inter") && !isSchoolEducation(collegeEducationType) && <View className="flex-row items-center gap-2 mr-4">
          <Text className="text-[#525252] text-base font-medium">
            {t("Academics.student.Semester", "Semester :")}
          </Text>
          <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
            <Text className="text-[#43C17A] text-base font-medium">{t("Academics.student.Sem", "Sem")}
              {subjectProps[0]?.semester || t("Academics.student.N/A", "N/A")}
            </Text>
          </View>
        </View>}

        {!isSchoolEducation(collegeEducationType) && <View className="flex-row items-center gap-2 mr-4">
          <Text className="text-[#525252] text-base font-medium">
            {t("Academics.student.Year", "Year :")}
          </Text>
          <View className="px-3 py-1 bg-[#DCEAE2] rounded-full">
            <Text className="text-[#43C17A] text-base font-medium">
              {subjectProps[0]?.academicYear || t("Academics.student.N/A", "N/A")}
            </Text>
          </View>
        </View>}
      </ScrollView>
    </View>

    <View className="flex-col gap-4 mb-5">
      {filteredSubjects.length > 0 ? filteredSubjects.map((item, index) => {

        const percentage = item.percentage ?? 0;
        return <View key={index} className="bg-white rounded-lg w-full min-h-[230px] p-4 flex-col justify-between shadow-sm border border-gray-100">

          <View className="flex-col gap-2">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-row items-center gap-3 flex-1 min-w-0">
                <Text className="text-[#282828] text-base max-w-[60%] truncate" numberOfLines={1} style={{
                  fontFamily: fonts.bold
                }}>
                  {item.subjectTitle}
                </Text>
                <View className="px-2 py-0.5 bg-[#DCEAE2] rounded-full">
                  <Text className="text-[#43C17A] text-base font-semibold">
                    {t("Academics.student.Credits", "Credits")}: {item.subjectCredits}
                  </Text>
                </View>
              </View>

              <TouchableOpacity className="bg-[#7051E1] px-2.5 py-1.5 rounded-md" onPress={() => handleViewDetails(item.subjectTitle)}>

                <Text className="text-white font-medium text-[11px]">
                  {t("Academics.student.View Details", "View Details")}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-2 mt-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[#282828] font-semibold text-base">
                  {t("Academics.student.Faculty -", "Faculty -")}
                </Text>
                <Avatar src={item.profileIcon} size={30} alt="faculty" />

                <Text className="text-[#525252] text-base" style={{
                  fontFamily: fonts.regular
                }}>
                  {item.lecturer}
                </Text>
              </View>

              <View className="flex-row items-center gap-5">
                <Text className="text-[#525252] text-base" style={{
                  fontFamily: fonts.regular
                }}>
                  <Text className="text-[#282828] font-medium">{t("Academics.student.Units", "Units:")} </Text>
                  {item.units}
                </Text>
                <Text className="text-[#525252] text-base" style={{
                  fontFamily: fonts.regular
                }}>
                  <Text className="text-[#282828] font-medium">{t("Academics.student.Topics Covered", "Topics Covered :")} </Text>
                  {item.topicsCovered}/{item.topicsTotal}
                </Text>
              </View>

              <Text className="text-[#525252] text-base truncate" numberOfLines={1} style={{
                fontFamily: fonts.regular
              }}>
                <Text className="text-[#282828]" style={{
                  fontFamily: fonts.medium
                }}>{t("Academics.student.Next lesson", "Next lesson :")} </Text>
                {item.nextLesson}
              </Text>
            </View>
          </View>

          <View className="flex-col mt-2 w-full">
            <View className="w-full rounded-full h-2 bg-gray-200 mt-3 relative overflow-visible">
              <View className="absolute top-0 left-0 h-full bg-[#6D4EE0] rounded-full" style={{
                width: `${percentage}%`
              }} />

              {percentage > 0 && <View className="absolute top-1/2 bg-white rounded-full border border-gray-300 shadow-sm" style={{
                left: `${percentage}%`,
                transform: [{
                  translateX: -ballSize / 2
                }, {
                  translateY: -ballSize / 2
                }],
                height: ballSize,
                width: ballSize
              }} />}
            </View>

            <View className="w-full h-5 mt-1 relative">
              <View className="absolute" style={{
                left: `${percentage}%`,
                transform: [{
                  translateX: percentage > 90 ? -40 : percentage < 10 ? 0 : -20
                }]
              }}>

                <Text className="text-[#6D4EE0] text-base" style={{
                  fontFamily: fonts.bold
                }}>
                  {item.percentage === null ? t("Academics.student.No data", "No data") : `${percentage}%`}
                </Text>
              </View>
            </View>
          </View>
        </View>;
      }) : <View className="py-10 flex-row justify-center items-center">
        <Text className="text-gray-400 text-sm" style={{
          fontFamily: fonts.regular
        }}>
          {t("No subjects found for {subject}", {
            subject: selectedSubject
          })}
        </Text>
      </View>}
    </View>

    <Modal transparent={true} visible={dropdownVisible} animationType="fade" onRequestClose={() => setDropdownVisible(false)}>

      <TouchableOpacity className="flex-1 bg-black/40 justify-center items-center" activeOpacity={1} onPress={() => setDropdownVisible(false)}>

        <View className="bg-white rounded-lg w-[80%] max-h-[50%] p-4 shadow-xl">
          <FlatList data={uniqueSubjects} keyExtractor={item => item} renderItem={({
            item
          }) => {
            return <TouchableOpacity className="py-3 border-b border-gray-100" onPress={() => {
              setSelectedSubject(item);
              setDropdownVisible(false);
            }}>

              <Text className={`text-sm ${selectedSubject === item ? "text-[#43C17A]" : "text-gray-700"}`} style={{
                fontFamily: fonts.bold
              }}>
                {item === "All" ? t("Academics.student.All", "All") : item}
              </Text>
            </TouchableOpacity>;
          }} />

        </View>
      </TouchableOpacity>
    </Modal>
  </ScrollView>;
}
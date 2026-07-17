import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { CaretDown } from 'phosphor-react-native';
import { useHeaderHeight } from '@react-navigation/elements';

import { useUser } from '@/utils/context/UserContext';
import { useFaculty } from '@/utils/context/faculty/useFaculty';
import { fetchFacultyContext } from '@/utils/context/faculty/facultyContextAPI';
import { getFacultySubjects } from '@/lib/helpers/faculty/getFacultySubjects';
import { CardProps } from '@/lib/types/faculty';

import SubjectCard from './components/SubjectCard';

export default function AcademicsScreen() {
  const { t } = useTranslation();
  const { userId, collegeId } = useUser();
  const { facultyId } = useFaculty();
  const navigation = useNavigation<any>();
  const headerHeight = useHeaderHeight();

  const [pageLoading, setPageLoading] = useState(true);
  const [subjects, setSubjects] = useState<CardProps[]>([]);
  const [facultyCtx, setFacultyCtx] = useState<any>(null);

  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [yearId, setYearId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [dropdownType, setDropdownType] = useState<'subject' | 'year' | 'section' | null>(null);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    if (userId === null || collegeId === null) {
      setPageLoading(false);
      return;
    }

    let isCancelled = false;

    async function loadSubjects() {
      try {
        if (!hasLoadedOnce.current) setPageLoading(true);

        const ctx = await fetchFacultyContext(userId as number);

        if (!ctx) {
          if (!isCancelled) setSubjects([]);
          return;
        }

        if (!isCancelled) setFacultyCtx(ctx);

        if (!ctx.subjectIds?.length) {
          if (!isCancelled) setSubjects([]);
          return;
        }

        const data = await getFacultySubjects({
          collegeId: collegeId as number,
          collegeEducationId: ctx.collegeEducationId,
          collegeBranchId: ctx.collegeBranchId,
          academicYearIds: ctx.academicYearIds,
          subjectIds: ctx.subjectIds,
          sectionIds: ctx.sectionIds
        });

        if (!isCancelled) {
          setSubjects(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to load subjects:", err);
          Toast.show({ type: "error", text1: "Failed to load subjects", text2: err?.message || JSON.stringify(err) });
        }
      } finally {
        if (!isCancelled) {
          setPageLoading(false);
          hasLoadedOnce.current = true;
        }
      }
    }

    loadSubjects();

    return () => {
      isCancelled = true;
    };
  }, [userId, collegeId]);

  const facultySections = facultyCtx?.sections ?? [];

  const filteredSections = facultySections.filter((fs: any) =>
    subjectId ? fs.collegeSubjectId === subjectId : true
  );

  const filteredCards = subjects.filter((card: any) => {
    const cardSubId = card.collegeSubjectId;
    const cardSecId = card.collegeSectionId;
    const cardYearId = card.collegeAcademicYearId;

    if (subjectId !== null && Number(cardSubId) !== Number(subjectId)) return false;
    if (yearId !== null && Number(cardYearId) !== Number(yearId)) return false;
    if (sectionId !== null && Number(cardSecId) !== Number(sectionId)) return false;

    return true;
  });

  if (pageLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F4F4F4]">
        <ActivityIndicator size="large" color="#43C17A" />
      </View>);
  }

  return (
    <View className="flex-1 bg-[#F4F4F4]" style={{ paddingTop: headerHeight + 16 }}>
      <View className="px-4 mb-4">
        <Text className="text-[#282828] text-2xl mb-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.MyClasses", "My Classes")}</Text>
        <Text className="text-[#525252] text-xs" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Trackprogressad", "Track progress, add lessons and manage course content")}</Text>
      </View>

      <View className="px-4 mb-4 flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-1 flex-1">
          <Text className="text-[#525252] text-[10px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Subject", "Subject:")}</Text>
          <TouchableOpacity onPress={() => setDropdownType('subject')} className="bg-[#DCEAE2] px-2 py-1 rounded-full flex-row items-center flex-1">
            <Text className="text-[#43C17A] text-[10px] flex-1" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
              {subjectId ? subjects.find((s) => s.collegeSubjectId === subjectId)?.subjectTitle : "All"}
            </Text>
            <CaretDown size={10} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-1 flex-1">
          <Text className="text-[#525252] text-[10px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Year", "Year:")}</Text>
          <TouchableOpacity onPress={() => setDropdownType('year')} className="bg-[#DCEAE2] px-2 py-1 rounded-full flex-row items-center flex-1">
            <Text className="text-[#43C17A] text-[10px] flex-1" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
              {yearId ? facultyCtx?.collegeAcademicYears?.find((y: any) => y.collegeAcademicYearId === yearId)?.collegeAcademicYear : "All"}
            </Text>
            <CaretDown size={10} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-1 flex-1">
          <Text className="text-[#525252] text-[10px]" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Section", "Section:")}</Text>
          <TouchableOpacity onPress={() => setDropdownType('section')} className="bg-[#DCEAE2] px-2 py-1 rounded-full flex-row items-center flex-1">
            <Text className="text-[#43C17A] text-[10px] flex-1" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
              {sectionId ? filteredSections.find((s: any) => s.collegeSectionsId === sectionId)?.college_sections?.collegeSections : "All"}
            </Text>
            <CaretDown size={10} color="#43C17A" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredCards}
        keyExtractor={(item) => `${item.collegeSubjectId}-${item.collegeSectionId}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Noclassesassign", "No classes assigned")}</Text>
          </View>
        }
        renderItem={({ item }) =>
          <SubjectCard
            item={item}
            onViewDetails={() => {
              navigation.navigate('SubjectDetailsScreen', { details: item });
            }} />
        } />
      <Modal visible={!!dropdownType} transparent animationType="fade" onRequestClose={() => setDropdownType(null)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setDropdownType(null)} className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white w-full max-h-[60%] rounded-xl overflow-hidden p-4">
            <Text className="text-lg text-[#282828] mb-4" style={{ fontFamily: fonts.bold }}>
              {dropdownType === 'subject' ? 'Select Subject' : dropdownType === 'year' ? 'Select Year' : 'Select Section'}
            </Text>
            <FlatList
              data={dropdownType === 'subject' ?
                [{ id: null, title: 'All' }, ...Array.from(new Map(subjects.map(s => [s.collegeSubjectId, s])).values()).map(s => ({ id: s.collegeSubjectId, title: s.subjectTitle }))]
                : dropdownType === 'year' ?
                [{ id: null, title: 'All' }, ...(facultyCtx?.collegeAcademicYears?.map((y: any) => ({ id: y.collegeAcademicYearId, title: y.collegeAcademicYear })) || [])]
                :
                [{ id: null, title: 'All' }, ...Array.from(new Map(filteredSections.map((s: any) => [s.collegeSectionsId, s])).values()).map((s: any) => ({ id: s.collegeSectionsId, title: s.college_sections?.collegeSections }))]
              }
              keyExtractor={(item, index) => item.id ? item.id.toString() : `all-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-3 border-b border-gray-100 flex-row justify-between items-center"
                  onPress={() => {
                    if (dropdownType === 'subject') {
                      setSubjectId(item.id as number | null);
                      if (item.id !== subjectId) setSectionId(null);
                    } else if (dropdownType === 'year') {
                      setYearId(item.id as number | null);
                    } else {
                      setSectionId(item.id as number | null);
                    }
                    setDropdownType(null);
                  }}
                >
                  <Text className="text-[#525252] text-sm" style={{ fontFamily: fonts.regular }}>{item.title}</Text>
                  {((dropdownType === 'subject' && subjectId === item.id) || (dropdownType === 'year' && yearId === item.id) || (dropdownType === 'section' && sectionId === item.id)) && (
                    <View className="w-2 h-2 rounded-full bg-[#43C17A]" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>);
}
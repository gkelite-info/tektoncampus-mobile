// import React, { useState, useEffect, useRef } from 'react';
// import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import Toast from 'react-native-toast-message';
// import { CaretDown } from 'phosphor-react-native';

// import { useUser } from '@/utils/context/UserContext';
// import { useFaculty } from '@/utils/context/faculty/useFaculty';
// import { fetchFacultyContext } from '@/utils/context/faculty/facultyContextAPI';
// import { getFacultySubjects } from '@/lib/helpers/faculty/getFacultySubjects';
// import { CardProps } from '@/lib/types/faculty';

// import SubjectCard from './components/SubjectCard';

// export default function AcademicsScreen() {
//   const { userId, collegeId } = useUser();
//   const { facultyId } = useFaculty();
//   const navigation = useNavigation<any>();

//   const [pageLoading, setPageLoading] = useState(true);
//   const [subjects, setSubjects] = useState<CardProps[]>([]);
//   const [facultyCtx, setFacultyCtx] = useState<any>(null);

//   const [subjectId, setSubjectId] = useState<number | null>(null);
//   const [sectionId, setSectionId] = useState<number | null>(null);

//   const hasLoadedOnce = useRef(false);

//   useEffect(() => {
//     if (userId === null || collegeId === null) {
//       setPageLoading(false);
//       return;
//     }

//     let isCancelled = false;

//     async function loadSubjects() {
//       try {
//         if (!hasLoadedOnce.current) setPageLoading(true);

//         const ctx = await fetchFacultyContext(userId as number);

//         if (!ctx) {
//           if (!isCancelled) setSubjects([]);
//           return;
//         }

//         if (!isCancelled) setFacultyCtx(ctx);

//         if (!ctx.subjectIds?.length) {
//           if (!isCancelled) setSubjects([]);
//           return;
//         }

//         const data = await getFacultySubjects({
//           collegeId: collegeId as number,
//           collegeEducationId: ctx.collegeEducationId,
//           collegeBranchId: ctx.collegeBranchId,
//           academicYearIds: ctx.academicYearIds,
//           subjectIds: ctx.subjectIds,
//           sectionIds: ctx.sectionIds,
//         });

//         if (!isCancelled) {
//           setSubjects(data);
//         }
//       } catch (err) {
//         if (!isCancelled) {
//           Toast.show({ type: "error", text1: "Failed to load subjects" });
//         }
//       } finally {
//         if (!isCancelled) {
//           setPageLoading(false);
//           hasLoadedOnce.current = true;
//         }
//       }
//     }

//     loadSubjects();

//     return () => {
//       isCancelled = true;
//     };
//   }, [userId, collegeId]);

//   const facultySections = facultyCtx?.sections ?? [];

//   const filteredSections = facultySections.filter((fs: any) =>
//     subjectId ? fs.collegeSubjectId === subjectId : true
//   );

//   const filteredCards = subjects.filter((card: any) => {
//     const cardSubId = card.collegeSubjectId;
//     const cardSecId = card.collegeSectionId;

//     if (subjectId !== null && Number(cardSubId) !== Number(subjectId)) return false;
//     if (sectionId !== null && Number(cardSecId) !== Number(sectionId)) return false;

//     return true;
//   });

//   if (pageLoading) {
//     return (
//       <View className="flex-1 justify-center items-center bg-[#F4F4F4]">
//         <ActivityIndicator size="large" color="#43C17A" />
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-[#F4F4F4] pt-24">
//       <View className="px-4 mb-4">
//         <Text className="text-[#282828] font-bold text-2xl mb-1">My Classes</Text>
//         <Text className="text-[#525252] text-xs">Track progress, add lessons and manage course content</Text>
//       </View>

//       <View className="px-4 mb-4 flex-row items-center justify-between">
//          <View className="flex-row items-center gap-2 flex-1">
//             <Text className="text-[#525252] text-xs">Subject:</Text>
//             <View className="bg-[#DCEAE2] px-3 py-1 rounded-full flex-row items-center flex-1">
//               <Text className="text-[#43C17A] text-xs font-bold flex-1" numberOfLines={1}>
//                 {subjectId ? subjects.find(s => s.collegeSubjectId === subjectId)?.subjectTitle : "All"}
//               </Text>
//               <CaretDown size={12} color="#43C17A" weight="bold" />
//             </View>
//          </View>

//          <View className="flex-row items-center gap-2 flex-1 ml-4">
//             <Text className="text-[#525252] text-xs">Section:</Text>
//             <View className="bg-[#DCEAE2] px-3 py-1 rounded-full flex-row items-center flex-1">
//               <Text className="text-[#43C17A] text-xs font-bold flex-1" numberOfLines={1}>
//                 {sectionId ? filteredSections.find((s:any) => s.collegeSectionsId === sectionId)?.college_sections?.collegeSections : "All"}
//               </Text>
//               <CaretDown size={12} color="#43C17A" weight="bold" />
//             </View>
//          </View>
//       </View>

//       <FlatList
//         data={filteredCards}
//         keyExtractor={item => `${item.collegeSubjectId}-${item.collegeSectionId}`}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 100 }}
//         ListEmptyComponent={
//           <View className="items-center justify-center mt-10">
//             <Text className="text-gray-500 font-semibold">No classes assigned</Text>
//           </View>
//         }
//         renderItem={({ item }) => (
//           <SubjectCard
//             item={item}
//             onViewDetails={() => {
//               navigation.navigate('SubjectDetailsScreen', { details: item });
//             }}
//           />
//         )}
//       />
//     </View>
//   );
// }

import React from 'react';
import { View, Text } from 'react-native';

export default function AcademicsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-[#F4F4F4] px-6">
      <Text className="mb-3 font-bold text-3xl text-[#282828]">Academics</Text>

      <Text className="text-center text-base leading-6 text-[#525252]">
        This module is currently under development.
      </Text>

      <Text className="mt-2 text-center text-sm text-[#8A8A8A]">
        Features for class management, lessons, attendance, and academic tracking will be available
        soon.
      </Text>
    </View>
  );
}

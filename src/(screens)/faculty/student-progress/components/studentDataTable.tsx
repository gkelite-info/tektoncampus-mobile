import React, { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList } from "react-native";
import { MagnifyingGlass, X, CaretLeft, CaretRight } from "phosphor-react-native";
import tw from "twrnc";
import { PieChart } from "react-native-gifted-charts";
import { useNavigation } from "@react-navigation/native";
import type { FacultyStudentProgressRow } from "@/lib/helpers/faculty/studentProgress/getFacultyStudentProgressSummary";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { FacultyDrawerParamList } from "@/navigation/FacultyDrawerNavigator";

const getProgressColor = (progress: number): string => {
  if (progress >= 90) return "#43C17A";
  if (progress >= 80) return "#5DC98A";
  if (progress >= 60) return "#F9A825";
  if (progress >= 40) return "#FFBB70";
  return "#FF3B30";
};

export const ReactNativeProgressCircle: React.FC<{ progress: number }> = ({ progress }) => {
  const color = getProgressColor(progress);
  
  return (
    <View style={tw`relative items-center justify-center h-10 w-10`}>
      <PieChart
        donut
        radius={16}
        innerRadius={11}
        data={[
          { value: progress, color },
          { value: 100 - progress, color: "#E5E7EB" },
        ]}
      />
      <View style={tw`absolute items-center justify-center`}>
        <Text style={[tw`font-bold`, { color, fontSize: 8 }]}>{progress}%</Text>
      </View>
    </View>
  );
};

type StudentDataTableProps = {
  students: FacultyStudentProgressRow[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
};

const formatScore = (obtained: number, total: number) => (total > 0 ? `${obtained}/${total}` : "-");

const hasAnyProgressData = (student: FacultyStudentProgressRow) =>
  student.conductedClasses > 0 ||
  student.totalAssignments > 0 ||
  student.totalQuizMarks > 0 ||
  student.totalDiscussionForumMarks > 0;

export function StudentDataTable({
  students,
  searchQuery,
  onSearchQueryChange,
  currentPage,
  totalPages,
  totalRecords,
  onPageChange,
}: StudentDataTableProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<FacultyDrawerParamList>>();
  const searchInputRef = useRef<TextInput>(null);
  const tableHeaders = [
    "Roll No.",
    "Student Name",
    "Attendance",
    "Assignments Done",
    "Quiz",
    "Discussion Forum",
    "Progress %",
    "Action",
  ];

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const handleSearchToggle = () => {
    if (isSearchOpen && searchQuery) {
      onSearchQueryChange("");
      return;
    }
    setIsSearchOpen((current) => !current);
  };

  const renderStudentRow = ({ item: student }: { item: FacultyStudentProgressRow }) => (
    <View style={tw`flex-row border-b border-gray-100 bg-white items-center py-2 px-2`}>
      <View style={tw`w-14 items-center justify-center`}>
        <Image
          source={student.profileUrl ? { uri: student.profileUrl } : require("../../../../../assets/maleuser.png")}
          defaultSource={require("../../../../../assets/maleuser.png")}
          style={tw`h-8 w-8 rounded-full`}
        />
      </View>
      <Text style={tw`w-28 px-3 text-sm font-medium text-gray-700`} numberOfLines={1}>{student.rollNo}</Text>
      <Text style={tw`w-32 px-3 text-sm font-medium text-gray-700`} numberOfLines={1}>{student.studentName}</Text>
      <Text style={tw`w-28 px-3 text-sm text-gray-600`}>{student.conductedClasses > 0 ? `${student.attendancePercentage}%` : "-"}</Text>
      <Text style={tw`w-36 px-3 text-sm text-gray-600`}>{student.totalAssignments > 0 ? `${student.assignmentsDoneCount}/${student.totalAssignments}` : "-"}</Text>
      <Text style={tw`w-20 px-3 text-sm text-gray-600`}>{formatScore(student.quizMarksObtained, student.totalQuizMarks)}</Text>
      <Text style={tw`w-36 px-3 text-sm text-gray-600`}>{formatScore(student.discussionForumMarksObtained, student.totalDiscussionForumMarks)}</Text>
      <View style={tw`w-24 px-3 items-center justify-center`}>
        {hasAnyProgressData(student) ? <ReactNativeProgressCircle progress={student.progressPercent} /> : <Text style={tw`text-sm text-gray-600`}>-</Text>}
      </View>
      <View style={tw`w-24 px-3 items-center justify-center`}>
        <TouchableOpacity
          style={tw`border border-gray-300 px-3 py-1 rounded-md`}
          onPress={() => navigation.navigate("StudentProgressDetailsScreen", { rollNo: student.rollNo, studentId: student.studentId } as any)}
        >
          <Text style={tw`text-gray-600 text-sm`}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={tw`w-full`}>
      <View style={tw`mb-2 flex-row items-center justify-between`}>
        <Text style={tw`font-bold text-[#282828] text-base`}>Class Progress Overview</Text>
      </View>

      <View style={tw`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`w-full`}>
          <View>
            <View style={tw`flex-row bg-[#F1F3F2] py-3 px-2 items-center`}>
              <View style={tw`w-14 items-center justify-center`}>
                <TouchableOpacity
                  onPress={handleSearchToggle}
                  style={tw`h-8 w-8 items-center justify-center rounded-full bg-[#43C17A]`}
                >
                  {isSearchOpen ? <X size={16} color="white" weight="bold" /> : <MagnifyingGlass size={16} color="white" weight="bold" />}
                </TouchableOpacity>
              </View>
              <Text style={tw`w-28 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[0]}</Text>
              <Text style={tw`w-32 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[1]}</Text>
              <Text style={tw`w-28 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[2]}</Text>
              <Text style={tw`w-36 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[3]}</Text>
              <Text style={tw`w-20 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[4]}</Text>
              <Text style={tw`w-36 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[5]}</Text>
              <Text style={tw`w-24 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[6]}</Text>
              <Text style={tw`w-24 px-3 text-sm font-semibold text-[#282828]`}>{tableHeaders[7]}</Text>
            </View>

            {isSearchOpen && (
              <View style={tw`flex-row bg-[#F1F3F2] py-2 px-2 items-center border-t border-gray-200`}>
                <View style={tw`w-14`} />
                <View style={tw`flex-row flex-1 items-center bg-white rounded-full px-3 py-1.5 border border-gray-200 mx-3`}>
                  <MagnifyingGlass size={16} color="#43C17A" />
                  <TextInput
                    ref={searchInputRef}
                    value={searchQuery}
                    onChangeText={onSearchQueryChange}
                    placeholder="Search roll no or name"
                    style={tw`flex-1 ml-2 text-sm text-[#282828]`}
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            )}

            <FlatList
              data={students}
              keyExtractor={(item) => item.studentId.toString()}
              renderItem={renderStudentRow}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={tw`py-8 items-center justify-center w-[800px]`}>
                  <Text style={tw`text-sm text-[#6B7280]`}>
                    {searchQuery ? "No students found for that search." : "No student progress data available."}
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>

        {totalPages > 1 && (
          <View style={tw`flex-row flex-wrap items-center justify-between border-t border-gray-100 p-4 gap-4`}>
            <Text style={tw`text-xs text-[#6B7280]`}>
              Showing page {currentPage} of {totalPages} ({totalRecords} records)
            </Text>

            <View style={tw`flex-row items-center gap-2`}>
              <TouchableOpacity
                onPress={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={tw`h-8 w-8 items-center justify-center rounded-lg border ${currentPage === 1 ? "border-gray-200" : "border-gray-300"}`}
              >
                <CaretLeft size={16} weight="bold" color={currentPage === 1 ? "#D1D5DB" : "#4B5563"} />
              </TouchableOpacity>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={tw`max-w-[150px]`}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <TouchableOpacity
                    key={page}
                    onPress={() => onPageChange(page)}
                    style={tw`h-8 min-w-8 items-center justify-center rounded-lg mx-1 px-2 ${currentPage === page ? "bg-[#16284F]" : "border border-gray-300 bg-white"}`}
                  >
                    <Text style={tw`text-sm font-semibold ${currentPage === page ? "text-white" : "text-gray-600"}`}>{page}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                style={tw`h-8 w-8 items-center justify-center rounded-lg border ${currentPage === totalPages ? "border-gray-200" : "border-gray-300"}`}
              >
                <CaretRight size={16} weight="bold" color={currentPage === totalPages ? "#D1D5DB" : "#4B5563"} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

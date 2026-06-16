import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchFacultyFinanceMeetings } from "@/lib/helpers/finance/meetings/meetingsAPI";
import { fetchStudentFinanceMeetings } from "@/lib/helpers/finance/meetings/meetingsAPI";
import MeetingCard from "./components/MeetingCard";
import MeetingCardShimmer from "@/utils/shimmers/MeetingCardShimmer";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import Toast from "react-native-toast-message";

type MeetingType = "upcoming" | "previous";

interface SharedMeetingsProps {
  mode: "Faculty" | "Student";
  fetchParams: any; 
}

export default function SharedMeetings({ mode, fetchParams }: SharedMeetingsProps) {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentType, setCurrentType] = useState<MeetingType>("upcoming");
  const [meetings, setMeetings] = useState<any[]>([]);

  const updateFilter = (type: MeetingType) => {
    setIsLoading(true);
    setPage(1);
    setCurrentType(type);
  };

  const formatMeetingDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const typeTabs: { id: MeetingType; label: string }[] = [
    { id: "upcoming", label: "Upcoming Meetings" },
    { id: "previous", label: "Previous Meetings" },
  ];

  const loadMeetings = useCallback(async () => {
    
    if (!fetchParams) {
      setMeetings([]);
      return;
    }

    try {
      setIsLoading(true);
      setMeetings([]);

      let res;
      if (mode === "Faculty") {
        res = await fetchFacultyFinanceMeetings({
          ...fetchParams,
          type: currentType,
          page,
          limit: 10,
        });
      } else {
        if (!fetchParams.collegeBranchCode || !fetchParams.collegeSectionsId) return;
        res = await fetchStudentFinanceMeetings({
          ...fetchParams,
          type: currentType,
          page,
          limit: 10,
        });
      }

      const finalMeetings = res.data.map((meeting: any) => ({
        ...meeting,
        section: meeting.section || fetchParams.college_sections || "N/A",
        date: formatMeetingDate(meeting.date),
      }));

      setMeetings(finalMeetings);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Failed to fetch ${currentType} meetings`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentType, page, mode, JSON.stringify(fetchParams)]);

  useEffect(() => {
    loadMeetings();
  }, [loadMeetings]);

  return (
    <View className="flex-1 bg-[#F9FAFB]" style={{ paddingTop: insets.top + 105 }}>
      <View className="flex-1 px-4 py-2 bg-white">
        <View className="flex-row justify-between items-start mb-6 mt-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-[#282828]">Meetings</Text>
            <Text className="text-[#282828] text-sm mt-1">
              View and join scheduled meetings.
            </Text>
          </View>
        </View>

        <View className="items-center justify-center w-full mb-4">
          <View className="bg-[#f3f4f6] p-1.5 rounded-full flex-row">
            {typeTabs.map((tab) => {
              const isActive = currentType === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => updateFilter(tab.id)}
                  className={`px-5 py-2 rounded-full ${
                    isActive ? "bg-[#43C17A]" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isActive ? "text-[#E9E9E9]" : "text-[#414141]"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <MeetingCardShimmer
              role={mode}
              category={mode}
              type={currentType}
              count={5}
            />
          ) : meetings.length > 0 ? (
            <View className="pb-10">
              {meetings.map((meeting) => (
                <MeetingCard key={meeting.id} data={meeting} role={mode} />
              ))}
            </View>
          ) : (
            <View className="py-20 items-center justify-center bg-white rounded-xl border border-dashed border-gray-300">
              <Text className="text-lg text-gray-500 text-center">
                No {currentType} meetings found.
              </Text>
            </View>
          )}

          {totalPages > 1 && (
            <View className="flex-row justify-center pb-8 mt-4 gap-2 items-center">
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`p-2 rounded-md ${
                  page === 1 ? "bg-gray-100" : "bg-gray-200"
                }`}
              >
                <CaretLeft
                  size={16}
                  weight="bold"
                  color={page === 1 ? "#9ca3af" : "#374151"}
                />
              </TouchableOpacity>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-md ${
                    page === p ? "bg-[#16284F]" : "bg-gray-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      page === p ? "text-white" : "text-[#374151]"
                    }`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`p-2 rounded-md ${
                  page === totalPages ? "bg-gray-100" : "bg-gray-200"
                }`}
              >
                <CaretRight
                  size={16}
                  weight="bold"
                  color={page === totalPages ? "#9ca3af" : "#374151"}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

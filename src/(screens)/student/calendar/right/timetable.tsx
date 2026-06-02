import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { supabase } from "@/lib/supabaseClient";
import { fetchStudentTimetableByDate } from "@/lib/helpers/profile/calender/fetchStudentTimetable";
import { FilePdf } from "phosphor-react-native";
import { useStudent } from "@/utils/context/student/useStudent";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import TimetableCardShimmer from "./TimetableCardShimmer";
import { fetchTopicResources } from "@/lib/helpers/faculty/Savetopicresource";

export const Loader = () => (
    <View className="flex-1 justify-center items-center h-[300px]">
        <View className="w-10 h-10 border-4 border-gray-200 border-t-[#16284F] rounded-full animate-spin" />
    </View>
);

const formatTimeToAMPM = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hour = Number(h);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${period}`;
};

interface CalendarTimeTableProps {
    selectedDate: string;
}

export default function CalendarTimeTable({ selectedDate }: CalendarTimeTableProps) {
    const [todayDate, setTodayDate] = useState("");
    const [todayDay, setTodayDay] = useState("");
    const [mobileDayName, setMobileDayName] = useState("");
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const { collegeEducationType } = useStudent();

    useEffect(() => {
        const now = new Date();
        setTodayDate(String(now.getDate()).padStart(2, "0"));
        setTodayDay(now.toLocaleString("en-US", { weekday: "short" }));
    }, []);

    useEffect(() => {
        if (selectedDate) {
            const dateObj = new Date(selectedDate);
            setMobileDayName(dateObj.toLocaleDateString("en-US", { weekday: "short" }));
        }

        const loadTimetable = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error("No auth user");

                const { data: userRow } = await supabase
                    .from("users")
                    .select("userId")
                    .eq("auth_id", user.id)
                    .single();

                if (!userRow) throw new Error("Internal user not found");

                const studentContext = await fetchStudentContext(userRow.userId);
                const isInter = collegeEducationType === "Inter";

                const rawData = await fetchStudentTimetableByDate({
                    date: selectedDate,
                    collegeEducationId: studentContext.collegeEducationId,
                    collegeBranchId: studentContext.collegeBranchId,
                    collegeAcademicYearId: studentContext.collegeAcademicYearId,
                    collegeSemesterId: studentContext.collegeSemesterId,
                    collegeSectionId: studentContext.collegeSectionsId,
                    isInter: isInter,
                });

                const timetableWithResources = await Promise.all(
                    rawData.map(async (item: any) => {
                        let pdfUrl = null;
                        if (item.topicId) {
                            const resources = await fetchTopicResources(item.topicId);
                            if (resources && resources.length > 0) {
                                pdfUrl = resources[0].resourceUrl;
                            }
                        }
                        return {
                            start: formatTimeToAMPM(item.fromTime),
                            end: formatTimeToAMPM(item.toTime),
                            title: item.eventTitle,
                            topic: item.eventTopic,
                            room: item.roomNo,
                            faculty: item.facultyName,
                            isCancelled: item.isCancelled,
                            pdfUrl: pdfUrl,
                        };
                    })
                );
                setTimetable(timetableWithResources);
            } catch (err) {
                console.error("Failed to load timetable", err);
                setTimetable([]);
            } finally {
                setLoading(false);
            }
        };

        loadTimetable();
    }, [selectedDate, collegeEducationType]);

    const mobileDateNum = selectedDate ? new Date(selectedDate).getDate() : "";

    const handleOpenPdf = async (url: string) => {
        if (!url) return;
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            console.error("Cannot open download url handle: ", url);
        }
    };

    return (
        <ScrollView
            className="flex-1 bg-gray-50/50 px-4"
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-row items-center mt-3 mb-4">
                <View className="bg-[#16284F] flex-col items-center justify-center w-12 h-12 rounded-l-xl">
                    <Text className="text-[16px] font-black text-white leading-none">
                        {mobileDateNum || todayDate}
                    </Text>
                    <Text className="text-[10px] font-light text-gray-200 mt-0.5 uppercase tracking-tighter">
                        {mobileDayName || todayDay}
                    </Text>
                </View>
                <View className="bg-gray-200/80 h-12 flex-1 justify-center px-4 rounded-r-xl">
                    <Text className="text-[#16284F] font-bold text-base">
                        Timetable
                    </Text>
                </View>
            </View>

            <View className="flex-col gap-3 pb-6">
                {loading ? (
                    <TimetableCardShimmer count={4} />
                ) : timetable.length === 0 ? (
                    <View className="flex-col items-center justify-center py-12">
                        <Text className="text-center text-gray-500 font-medium text-sm">
                            No classes scheduled
                        </Text>
                    </View>
                ) : (
                    timetable.map((item, index) => (
                        <View
                            key={index}
                            className="bg-white rounded-xl p-4 flex-row gap-3 items-center shadow-sm border border-gray-100"
                        >
                            <View className="w-16 flex-col items-center justify-center border-r border-gray-100 pr-2 shrink-0">
                                <Text className="text-gray-800 font-bold text-[10px] text-center">{item.start}</Text>
                                <Text className="text-gray-400 my-0.5 text-xs font-bold">|</Text>
                                <Text className="text-gray-600 font-semibold text-[10px] text-center">{item.end}</Text>
                            </View>

                            <View className="flex-1 min-w-0 pr-6 relative">
                                <Text className="text-[#16284F] font-bold text-sm truncate leading-tight">
                                    {item.title}
                                </Text>

                                <Text className="text-gray-700 text-xs mt-1.5 truncate">
                                    <Text className="font-semibold text-gray-800">Topic: </Text>
                                    {item.topic || "N/A"}
                                </Text>

                                <View className="flex-row items-center flex-wrap gap-x-2 mt-1">
                                    <Text className="text-gray-500 text-[11px]">
                                        <Text className="font-semibold text-gray-700">Room: </Text>
                                        {item.room || "-"}
                                    </Text>
                                    <Text className="text-gray-300 text-[11px]">·</Text>
                                    <Text className="text-gray-500 text-[11px] flex-1 truncate">
                                        <Text className="font-semibold text-gray-700">Faculty: </Text>
                                        {item.faculty}
                                    </Text>
                                </View>

                                {item.isCancelled && (
                                    <Text className="text-red-500 text-[10px] font-black tracking-wide mt-1">
                                        CANCELLED
                                    </Text>
                                )}

                                <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() => item.pdfUrl && handleOpenPdf(item.pdfUrl)}
                                    disabled={!item.pdfUrl}
                                    className={`absolute right-[-6px] bottom-[6px] rounded-full h-8 w-8 items-center justify-center ${item.pdfUrl ? "bg-[#16284F]" : "bg-gray-200"
                                        }`}
                                >
                                    <FilePdf
                                        size={16}
                                        color={item.pdfUrl ? "#FFFFFF" : "#9CA3AF"}
                                        weight="fill"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}
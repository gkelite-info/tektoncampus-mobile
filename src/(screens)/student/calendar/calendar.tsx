import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabaseClient";
import { useStudent } from "@/utils/context/student/useStudent";
import { getUserIdFromAuth } from "@/lib/helpers/fetchUserDetails";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import { fetchStudentTimetableByDate } from "@/lib/helpers/profile/calender/fetchStudentTimetable";
import { fetchFacultyTasksForStudent } from "@/lib/helpers/faculty/facultyTasks";
import { fonts } from "@/constants/fonts";

function getWeekDays(locale: string) {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    const diffToMonday = day === 0 ? -6 : 1 - day;
    monday.setDate(today.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        days.push({
            dayName: date.toLocaleDateString(
                locale === "te" ? "te-IN" : locale === "hi" ? "hi-IN" : "en-US",
                { weekday: "short" },
            ),
            dateNum: date.getDate(),
            fullDate: date.toISOString().split("T")[0],
            isToday: date.toDateString() === today.toDateString(),
        });
    }
    return days;
}

interface TimetableEntry {
    subject?: string;
    subjectName?: string;
    startTime?: string;
    endTime?: string;
    facultyName?: string;
    roomNo?: string;
    [key: string]: any;
}

interface DayData {
    classCount: number;
    quizCount: number;
    assignmentCount: number;
    discussionCount: number;
    facultyTasks: any[];
    quizzes: any[];
    assignments: any[],
    timetable: TimetableEntry[];
    focus: string;
    tip: string;
}

function TimetableRow({ entry }: { entry: TimetableEntry }) {
    const subject = entry.subjectName ?? entry.subject ?? "Class";
    const time =
        entry.startTime && entry.endTime
            ? `${entry.startTime} – ${entry.endTime}`
            : entry.startTime ?? "";
    const faculty = entry.facultyName ?? "";
    const room = entry.roomNo ?? "";

    return (
        <View
            className="flex-row items-center bg-white rounded-xl px-3 py-2.5 mb-2"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
            }}
        >
            <View className="w-1 h-full bg-[#43C17A] rounded-full mr-3" />

            <View className="flex-1">
                <Text className="text-[#282828] font-semibold text-[13px]" numberOfLines={1}>
                    {subject}
                </Text>
                {!!time && (
                    <Text className="text-[#43C17A] text-[11px] font-medium mt-0.5">
                        {time}
                    </Text>
                )}
                {(!!faculty || !!room) && (
                    <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>
                        {[faculty, room].filter(Boolean).join("  ·  ")}
                    </Text>
                )}
            </View>
        </View>
    );
}

function StatCard({
    count,
    label,
    color,
    bg,
}: {
    count: number;
    label: string;
    color: string;
    bg: string;
}) {
    return (
        <View
            className="flex-1 rounded-2xl items-center justify-center py-4 mx-1"
            style={{ backgroundColor: bg }}
        >
            <Text style={{ color, fontSize: 28, fontWeight: "700", lineHeight: 32 }}>
                {count}
            </Text>
            <Text
                style={{ color, fontSize: 11, fontWeight: "600", textAlign: "center", marginTop: 4, fontFamily: fonts.medium }}
            >
                {label}
            </Text>
        </View>
    );
}

export default function StudentCalendar() {
    const { t, i18n } = useTranslation("Calendar.student");
    const locale = i18n.language;
    const headerHeight = useHeaderHeight();

    const week = useMemo(() => getWeekDays(locale), [locale]);
    const { collegeEducationType } = useStudent();

    const today = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [weeklyData, setWeeklyData] = useState<Record<string, DayData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) {
                    console.log("❌ [Calendar] No authenticated user found.");
                    return;
                }

                const userResult = await getUserIdFromAuth(user.id);
                if (!userResult.success || !userResult.userId) {
                    console.log("❌ [Calendar] Failed to get userId from auth.", userResult);
                    return;
                }

                const studentContext = await fetchStudentContext(userResult.userId);
                if (!studentContext) {
                    console.log("❌ [Calendar] Student Context is empty or failed to load.");
                    return;
                }

                const resultsMap: Record<string, DayData> = {};
                const currentDate = new Date();
                const todayInt = Number(
                    `${currentDate.getFullYear()}${String(currentDate.getMonth() + 1).padStart(2, "0")}${String(currentDate.getDate()).padStart(2, "0")}`
                );
                const assignmentRes = await supabase
                    .from("assignments")
                    .select("*")
                    .eq("collegeBranchId", studentContext.collegeBranchId)
                    .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
                    .eq("collegeSectionsId", studentContext.collegeSectionsId)
                    .eq("status", "Active")
                    .eq("is_deleted", false)
                    .is("deletedAt", null)
                    .gte("submissionDeadlineInt", todayInt);

                if (assignmentRes.error) {
                    console.error("Assignments query error:", assignmentRes.error);
                }

                const promises = week.map(async (day) => {
                    const [classes, quizRes, discRes, facultyTasks] = await Promise.all([
                        fetchStudentTimetableByDate({
                            date: day.fullDate,
                            collegeEducationId: studentContext.collegeEducationId,
                            collegeBranchId: studentContext.collegeBranchId,
                            collegeAcademicYearId: studentContext.collegeAcademicYearId,
                            collegeSemesterId: studentContext.collegeSemesterId,
                            collegeSectionId: studentContext.collegeSectionsId,
                            isInter: collegeEducationType === "Inter",
                        }),
                        supabase
                            .from("quizzes")
                            .select("*")
                            .eq("collegeSectionsId", studentContext.collegeSectionsId)
                            .eq("isActive", true)
                            .gte("startDate", `${day.fullDate}T00:00:00`)
                            .lte("startDate", `${day.fullDate}T23:59:59`),
                        supabase
                            .from("discussion_forum_sections")
                            .select("discussionSectionId, discussion_forum!inner(deadline, title)")
                            .eq("collegeSectionsId", studentContext.collegeSectionsId)
                            .eq("is_deleted", false)
                            .gte("discussion_forum.deadline", `${day.fullDate}T00:00:00`)
                            .lte("discussion_forum.deadline", `${day.fullDate}T23:59:59`),
                        fetchFacultyTasksForStudent({
                            date: day.fullDate,
                            collegeId: studentContext.collegeId,
                            collegeBranchId: studentContext.collegeBranchId,
                            collegeAcademicYearId: studentContext.collegeAcademicYearId,
                            collegeSemesterId: studentContext.collegeSemesterId,
                        }),
                    ]);

                    const qCount = quizRes.data?.length ?? 0;
                    const aCount = assignmentRes.data?.length ?? 0;
                    const dCount = discRes.data?.length ?? 0;

                    let focus = t("General Revision");
                    if (aCount > 0 && assignmentRes.data?.[0]) {
                        focus = assignmentRes.data[0].topicName;
                    }
                    else if (qCount > 0 && quizRes.data?.[0]) focus = quizRes.data[0].quizTitle;

                    let tip = t("Organize your study desk");
                    const deadlines: string[] = [];
                    if (qCount > 0) deadlines.push(t("Quizzes", { count: qCount }));
                    if (aCount > 0) deadlines.push(t("Assignments", { count: aCount }));
                    if (dCount > 0) deadlines.push(t("Discussions", { count: dCount }));
                    if (deadlines.length > 0) {
                        tip = `${t("Check the deadlines for")}: ${deadlines.join(", ")}`;
                    }

                    resultsMap[day.fullDate] = {
                        classCount: classes?.length ?? 0,
                        quizCount: qCount,
                        assignmentCount: aCount,
                        discussionCount: dCount,
                        facultyTasks: facultyTasks ?? [],
                        quizzes: quizRes.data ?? [],
                        assignments: assignmentRes.data ?? [],
                        timetable: (classes as TimetableEntry[]) ?? [],
                        focus,
                        tip,
                    };
                });

                await Promise.all(promises);
                setWeeklyData(resultsMap);
            } catch (err) {
                console.error("🚨 CALENDAR LOAD ERROR:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [collegeEducationType, week, t]);

    const activeDayItem = week.find((d) => d.fullDate === selectedDate);
    const activeDayInfo = activeDayItem ? weeklyData[activeDayItem.fullDate] : null;

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F5F5F5]">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 16, paddingTop: headerHeight + 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-[#282828] text-2xl mb-1" style={{ fontFamily: fonts.bold }}>Calendar</Text>
                <Text className="text-[#282828] font-semibold text-[15px] mb-3">
                    Weekly Calendar Overview
                </Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8, gap: 8 }}
                >
                    {week.map((item, index) => {
                        const isActive = item.fullDate === selectedDate;
                        return (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.8}
                                onPress={() => setSelectedDate(item.fullDate)}
                                className={`flex-col items-center justify-center h-16 w-16 rounded-xl mx-0.5 ${isActive ? "bg-[#43C17A]" : "bg-[#DCEAE2]"
                                    }`}
                                style={
                                    isActive
                                        ? {
                                            shadowColor: "#43C17A",
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.35,
                                            shadowRadius: 6,
                                            elevation: 4,
                                            transform: [{ scale: 1.02 }],
                                        }
                                        : undefined
                                }
                            >
                                <Text
                                    className={`text-[12px] font-semibold ${isActive ? "text-white" : "text-[#282828]"
                                        }`}
                                >
                                    {item.dayName}
                                </Text>
                                <Text
                                    className={`text-[18px] font-bold ${isActive ? "text-white" : "text-[#282828]"
                                        }`}
                                >
                                    {item.dateNum}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {activeDayItem && (
                    <View
                        className="bg-[#43C17A] rounded-2xl p-3 flex-row items-stretch gap-3 mt-3"
                        style={{
                            shadowColor: "#43C17A",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <View className="bg-white rounded-xl flex-col items-center justify-center w-[72px]">
                            <Text className="text-[#43C17A] font-semibold text-[13px]">
                                {activeDayItem.dayName}
                            </Text>
                            <Text className="text-[#43C17A] font-bold text-[30px] leading-[34px]">
                                {activeDayItem.dateNum}
                            </Text>
                        </View>

                        <View className="flex-1 flex-col justify-center gap-1 pr-2 min-w-0">
                            {loading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <>
                                    <Text numberOfLines={1} className="text-white text-[11px] font-medium leading-4">
                                        {"📘 "}
                                        {!activeDayInfo ? "No Classes" : `${activeDayInfo.classCount} Classes`}
                                        {" · 📝 "}
                                        {!activeDayInfo ? "No Quizzes" : `${activeDayInfo.quizCount} Quizzes`}
                                    </Text>
                                    <Text numberOfLines={1} className="text-white text-[11px] font-medium leading-4">
                                        {"🧾 "}
                                        {!activeDayInfo ? "No Assignments" : `${activeDayInfo.assignmentCount} Assignments`}
                                        {" · 💬 "}
                                        {!activeDayInfo ? "No Discussions" : `${activeDayInfo.discussionCount} Discussions`}
                                    </Text>
                                    <Text numberOfLines={1} className="text-white text-[11px] font-semibold mt-0.5 leading-4">
                                        {"🎯 Focus Area: "}
                                        <Text className="font-normal">
                                            {!activeDayInfo ? "..." : activeDayInfo.focus}
                                        </Text>
                                    </Text>
                                    <Text numberOfLines={1} className="text-white/90 text-[10px] italic leading-[14px]">
                                        {"🪄 Tip: "}
                                        {!activeDayInfo ? "..." : activeDayInfo.tip}
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>
                )}

                <View className="mt-5">
                    <View className="flex-row items-center gap-3 mb-3">
                        <View
                            className="bg-[#1E2A45] rounded-lg items-center justify-center px-3 py-1.5"
                            style={{ minWidth: 48 }}
                        >
                            <Text className="text-white font-bold text-[16px] leading-[18px]">
                                {activeDayItem?.dateNum ?? ""}
                            </Text>
                            <Text className="text-white text-[10px] font-medium">
                                {activeDayItem?.dayName ?? ""}
                            </Text>
                        </View>
                        <Text className="text-[#282828] font-semibold text-[17px]">
                            Timetable
                        </Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color="#43C17A" size="small" />
                    ) : !activeDayInfo || activeDayInfo.timetable.length === 0 ? (
                        <Text className="text-gray-400 text-[13px] text-center py-6" style={{ fontFamily: fonts.regular }}>
                            No classes scheduled
                        </Text>
                    ) : (
                        activeDayInfo.timetable.map((entry, i) => (
                            <TimetableRow key={i} entry={entry} />
                        ))
                    )}
                </View>

                <View className="flex-row bg-white p-2 rounded-xl mt-5 mb-2" style={{ gap: 8 }}>
                    <StatCard
                        count={activeDayInfo?.quizCount ?? 0}
                        label={"Active\nQuizzes"}
                        color="#E75480"
                        bg="#FDE8F0"
                    />
                    <StatCard
                        count={activeDayInfo?.assignmentCount ?? 0}
                        label={"Active\nAssignments"}
                        color="#5B9BD5"
                        bg="#E8F1FB"
                    />
                    <StatCard
                        count={activeDayInfo?.discussionCount ?? 0}
                        label={"Active\nDiscussions"}
                        color="#9B6EC8"
                        bg="#F0E8FB"
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

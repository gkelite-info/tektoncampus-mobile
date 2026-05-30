import React, { useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from "react-native";
import { CaretCircleRight } from "phosphor-react-native";

interface QuizItem {
    quizTitle: string;
    [key: string]: any;
}

interface FacultyTaskItem {
    taskTitle: string;
    [key: string]: any;
}

const useLocale = () => "en";
const useTranslations = (namespace: string) => {
    return (key: string, options?: any) => options?.count !== undefined ? `${options.count} ${key}` : key;
};
const useStudent = () => ({ collegeEducationType: "Regular" });

const supabase = {
    auth: { getUser: async () => ({ data: { user: { id: "123" } } }) },
    from: (table: string) => ({
        select: (query: string) => ({
            eq: (col: string, val: any) => ({
                eq: (col2: string, val2: any) => ({
                    gte: (col3: string, val3: any) => ({
                        lte: (col4: string, val4: any) => Promise.resolve({ data: [] as QuizItem[] }) // Added type cast
                    })
                })
            })
        })
    })
};
const getUserIdFromAuth = async (id: string) => ({ success: true, userId: "student_123" });
const fetchStudentContext = async (id: string) => ({
    collegeEducationId: 1, collegeBranchId: 1, collegeAcademicYearId: 1, collegeSemesterId: 1, collegeSectionsId: 1, collegeId: 1
});
const fetchStudentTimetableByDate = async (params: any) => [] as any[];
const fetchFacultyTasksForStudent = async (params: any) => [] as FacultyTaskItem[]; // Added type cast
// ---------------------------------------------------------------------------------------

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

interface DayData {
    classCount: number;
    quizCount: number;
    assignmentCount: number;
    discussionCount: number;
    facultyTasks: FacultyTaskItem[];
    quizzes: QuizItem[];
    focus: string;
    tip: string;
}

interface CalendarLeftProps {
    onDateSelect: (date: string) => void;
    selectedDate: string;
    setExtraInfo: (info: any) => void;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function CalendarLeft({
    onDateSelect,
    selectedDate,
    setExtraInfo,
}: CalendarLeftProps) {
    const locale = useLocale();
    const t = useTranslations("Calendar.student");

    const week = useMemo(() => getWeekDays(locale), [locale]);
    const { collegeEducationType } = useStudent();

    const [weeklyData, setWeeklyData] = useState<Record<string, DayData>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (weeklyData[selectedDate]) {
            const data = weeklyData[selectedDate];
            setExtraInfo({
                quizzes: data.quizCount,
                assignments: data.assignmentCount,
                discussions: data.discussionCount,
                focus: data.focus,
                tip: data.tip,
            });
        }
    }, [selectedDate, weeklyData, setExtraInfo]);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                setLoading(true);
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                const userResult = await getUserIdFromAuth(user.id);
                if (!userResult.success || !userResult.userId) return;

                const studentContext = await fetchStudentContext(userResult.userId);
                if (!studentContext) return;

                const resultsMap: Record<string, DayData> = {};

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

                    const qCount = quizRes.data?.length || 0;
                    const aCount = facultyTasks?.length || 0;
                    const dCount = discRes.data?.length || 0;

                    let focus = t("General Revision");
                    if (aCount > 0 && facultyTasks) {
                        focus = facultyTasks[0].taskTitle;
                    } else if (qCount > 0 && quizRes.data) {
                        focus = quizRes.data[0].quizTitle;
                    }

                    let tip = t("Organize your study desk");
                    const deadlines = [];
                    if (qCount > 0) deadlines.push(t("Quizzes", { count: qCount }));
                    if (aCount > 0) deadlines.push(t("Assignments", { count: aCount }));
                    if (dCount > 0) deadlines.push(t("Discussions", { count: dCount }));

                    if (deadlines.length > 0) {
                        tip = `${t("Check the deadlines for")}: ${deadlines.join(", ")}`;
                    }

                    resultsMap[day.fullDate] = {
                        classCount: classes.length,
                        quizCount: qCount,
                        assignmentCount: aCount,
                        discussionCount: dCount,
                        facultyTasks: facultyTasks || [],
                        quizzes: quizRes.data || [],
                        focus,
                        tip,
                    };
                });

                await Promise.all(promises);
                setWeeklyData(resultsMap);
            } catch (err) {
                console.error("UI LOAD ERROR:", err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [collegeEducationType, week]);

    const activeDayIndex = week.findIndex(item => item.fullDate === selectedDate);
    const activeDayItem = week[activeDayIndex];
    const activeDayInfo = activeDayItem ? weeklyData[activeDayItem.fullDate] : null;

    return (
        <View className={`bg-white rounded-lg p-3 flex flex-col ${isTablet ? "shadow-md" : "bg-transparent p-0"}`}>
            <Text className="text-[#282828] font-medium text-base mb-3">
                {t("Weekly Calendar Overview")}
            </Text>

            {/* --- TABLET / LARGER SCREEN VIEW --- */}
            {isTablet ? (
                <View className="flex flex-col mt-2">
                    {week.map((item, index) => {
                        const isActive = item.fullDate === selectedDate;
                        const dayInfo = weeklyData[item.fullDate];

                        return (
                            <View
                                key={index}
                                className={`flex-row items-center p-3 rounded-md mt-2 gap-2 border ${isActive ? "bg-[#43C17A] border-[#43C17A]" : "bg-[#FFFFFF] border-[#D4D4D4]"
                                    }`}
                            >
                                <View
                                    className={`flex flex-col items-center justify-center h-[73px] w-[73px] rounded-md ${isActive ? "bg-[#FFFFFF]" : "bg-[#D3F1E0]"
                                        }`}
                                >
                                    <Text className={`text-xs font-semibold ${isActive ? "text-[#43C17A]" : "text-[#282828]"}`}>
                                        {item.dayName}
                                    </Text>
                                    <Text className={`text-lg font-bold ${isActive ? "text-[#43C17A]" : "text-[#282828]"}`}>
                                        {item.dateNum}
                                    </Text>
                                </View>

                                <View className="flex-1 flex-row justify-between items-center pl-2">
                                    <View className="flex-1 pr-2">
                                        <Text className={`text-xs font-medium ${isActive ? "text-white" : "text-[#282828]"}`}>
                                            📘 {loading || !dayInfo ? "0" : t("Classes", { count: dayInfo.classCount })} · 📝{" "}
                                            {loading || !dayInfo ? "0" : t("Quizzes", { count: dayInfo.quizCount })}
                                        </Text>
                                        <Text className={`text-xs font-medium mt-0.5 ${isActive ? "text-white" : "text-[#282828]"}`}>
                                            🧾 {loading || !dayInfo ? "0" : t("Assignments", { count: dayInfo.assignmentCount })} · 💬{" "}
                                            {loading || !dayInfo ? "0" : t("Discussions", { count: dayInfo.discussionCount })}
                                        </Text>
                                        <Text className={`text-[12px] mt-1 font-semibold ${isActive ? "text-white" : "text-[#43C17A]"}`}>
                                            🎯 {t("Focus Area")}:{" "}
                                            <Text className={isActive ? "text-white" : "text-[#282828] font-normal"}>
                                                {loading || !dayInfo ? "..." : dayInfo.focus}
                                            </Text>
                                        </Text>
                                        <Text className={`text-[11px] font-normal italic mt-0.5 ${isActive ? "text-white/80" : "text-gray-500"}`}>
                                            🪄 {t("Tip")}: {loading || !dayInfo ? "..." : dayInfo.tip}
                                        </Text>
                                    </View>

                                    {/* Changed onClick to onPress */}
                                    <TouchableOpacity
                                        activeOpacity={0.7}
                                        onPress={() => onDateSelect(item.fullDate)}
                                    >
                                        <CaretCircleRight
                                            size={28}
                                            weight="fill"
                                            color={isActive ? "#FFFFFF" : "#43C17A"}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })}
                </View>
            ) : (
                /* --- MOBILE VIEW --- */
                <View className="flex flex-col gap-3 w-full">
                    <View>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                            className="flex-row gap-2 w-full"
                        >
                            {week.map((item, index) => {
                                const isActive = item.fullDate === selectedDate;

                                return (
                                    /* Changed onClick to onPress */
                                    <TouchableOpacity
                                        key={index}
                                        activeOpacity={0.8}
                                        onPress={() => onDateSelect(item.fullDate)}
                                        className={`flex flex-col items-center justify-center h-16 w-16 rounded-lg mx-1 ${isActive ? "bg-[#43C17A] shadow-md" : "bg-[#DCEAE2]"
                                            }`}
                                    >
                                        <Text className={`text-[12px] font-semibold ${isActive ? "text-white" : "text-[#282828]"}`}>
                                            {item.dayName}
                                        </Text>
                                        <Text className={`text-[18px] font-bold ${isActive ? "text-white" : "text-[#282828]"}`}>
                                            {item.dateNum}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Active Data Block */}
                    {activeDayItem && (
                        <View className="bg-[#43C17A] rounded-xl p-3 flex-row items-center gap-3 shadow-md w-full">
                            <View className="bg-white rounded-lg flex flex-col items-center justify-center w-[72px] h-[72px]">
                                <Text className="text-[#43C17A] font-semibold text-[13px]">
                                    {activeDayItem.dayName}
                                </Text>
                                <Text className="text-[#43C17A] font-bold text-3xl">
                                    {activeDayItem.dateNum}
                                </Text>
                            </View>

                            <View className="flex-1 flex-col justify-center gap-0.5 pr-2">
                                {loading ? (
                                    <ActivityIndicator color="#ffffff" size="small" />
                                ) : (
                                    <>
                                        <Text numberOfLines={1} className="text-white text-[11px] font-medium leading-tight">
                                            📘 {!activeDayInfo ? "0" : t("Classes", { count: activeDayInfo.classCount })} · 📝{" "}
                                            {!activeDayInfo ? "0" : t("Quizzes", { count: activeDayInfo.quizCount })}
                                        </Text>
                                        <Text numberOfLines={1} className="text-white text-[11px] font-medium leading-tight">
                                            🧾 {!activeDayInfo ? "0" : t("Assignments", { count: activeDayInfo.assignmentCount })} · 💬{" "}
                                            {!activeDayInfo ? "0" : t("Discussions", { count: activeDayInfo.discussionCount })}
                                        </Text>
                                        <Text numberOfLines={1} className="text-white text-[11px] font-semibold mt-0.5 leading-tight">
                                            🎯 {t("Focus Area")}:{" "}
                                            <Text className="font-normal">
                                                {!activeDayInfo ? "..." : activeDayInfo.focus}
                                            </Text>
                                        </Text>
                                        <Text numberOfLines={1} className="text-white/90 text-[10px] italic leading-tight">
                                            🪄 {t("Tip")}: {!activeDayInfo ? "..." : activeDayInfo.tip}
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}
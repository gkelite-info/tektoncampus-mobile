import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    LayoutAnimation,
    UIManager,
    Dimensions,
    RefreshControl,
} from "react-native";
import { Chalkboard, UsersThree, CaretDown } from "phosphor-react-native";
import CardComponent from "@/utils/card";
import CourseScheduleCard from "@/utils/CourseScheduleCard";
import AttendanceInsight from "@/utils/insightChart";
import SemesterAttendanceCard from "@/utils/semesterAttendanceCard";
import WorkWeekCalendar from "@/utils/workWeekCalendar";
import SubjectAttendance from "./subject-attendance/subjectAttedance";
import SubjectAttendanceDetailsClient from "./subject-attendance-details/SubjectAttendanceDetails";
import AiAttendanceNotificationBanner from "@/utils/AiAttendanceNotificationBanner";
import { useUser } from "@/utils/context/UserContext";
import { useStudent } from "@/utils/context/student/useStudent";
import {
    DashboardSkeleton,
    TableSkeleton,
} from "./shimmer/attendanceDashSkeleton";
import { getStudentDashboardData } from "@/lib/helpers/student/attendance/studentAttendanceActions";
import { useTranslations } from "@/utils/useTranslations";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { fonts } from "@/constants/fonts";
import { FolderTree } from "lucide-react-native";


if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - 12) / 1;

type DashboardData = Awaited<ReturnType<typeof getStudentDashboardData>>;

interface TableRow {
    Subject: string;
    Faculty: string;
    TodaysStatus: React.ReactNode;
    statusRaw: string;
    ClassAttendance: string;
    Percentage: string;
}

function formatAttendanceStatus(status: string) {
    return status
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getStatusTextClass(status: string) {
    switch (status.toLowerCase()) {
        case "leave":
            return "text-[#FFBB70] font-medium";
        case "present":
            return "text-[#43C17A] font-medium";
        case "absent":
            return "text-[#FF2020] font-medium";
        default:
            return "text-gray-600";
    }
}

function StatusBadge({ status }: { status: string }) {
    const t = useTranslations("Attendance.student");
    const label = formatAttendanceStatus(status);

    if (status === "CLASS_CANCEL") {
        return (
            <View className="bg-[#F3F4F6] px-[10px] py-[2px] rounded-full">
                <Text className="text-[#6B7280] text-[12px] font-semibold">
                    {t(label)}
                </Text>
            </View>
        );
    }

    return (
        <Text className={`text-[13px] ${getStatusTextClass(status)}`}>
            {t(label)}
        </Text>
    );
}

export default function AttendanceClient() {
    const t = useTranslations("Attendance.student");

    const [currentTab, setCurrentTab] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const showSubjectAttendanceTable = currentTab === "subject-attendance";
    const showSubjectAttendanceDetails = currentTab === "subject-attendance-details";
    const hideRightSection = showSubjectAttendanceTable || showSubjectAttendanceDetails;

    const [dataLoading, setDataLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const { userId, loading: userLoading } = useUser();
    const { collegeEducationType, loading: studentLoading } = useStudent();
    const isInter = collegeEducationType === "Inter";

    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [, setTableLoading] = useState(false);

    const rowsPerPage = 10;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    const headerHeight = useHeaderHeight();

    useEffect(() => {
        if (userLoading || studentLoading) return;
        if (!userId) { setDataLoading(false); return; }
        let isMounted = true;

        async function fetchData() {
            try {
                setDataLoading(true);
                setTableLoading(true);
                const year = viewDate.getFullYear();
                const month = String(viewDate.getMonth() + 1).padStart(2, "0");
                const day = String(viewDate.getDate()).padStart(2, "0");
                const data = await getStudentDashboardData(
                    userId!, `${year}-${month}-${day}`, currentPage, rowsPerPage, isInter
                );
                if (isMounted) {
                    setDashboardData(data);
                    setTotalRecords(data.totalCount || 0);
                }
            } catch {
                // silent
            } finally {
                if (isMounted) { setDataLoading(false); setTableLoading(false); }
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [userId, viewDate, currentPage, isInter, userLoading, studentLoading]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        if (!userId) return;
        setRefreshing(true);
        try {
            const year = viewDate.getFullYear();
            const month = String(viewDate.getMonth() + 1).padStart(2, "0");
            const day = String(viewDate.getDate()).padStart(2, "0");
            const data = await getStudentDashboardData(
                userId, `${year}-${month}-${day}`, currentPage, rowsPerPage, isInter
            );
            setDashboardData(data);
            setTotalRecords(data.totalCount || 0);
        } catch {
            // silent
        } finally {
            setRefreshing(false);
        }
    }, [userId, viewDate, currentPage, isInter]);

    const handleCardClick = (cardId: number) => {
        if (cardId === 2) setCurrentTab("subject-attendance");
    };

    const toggleRow = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRow(expandedRow === index ? null : index);
    };

    const tableRows: TableRow[] =
        dashboardData?.tableData?.map((row) => ({
            Subject: row.subject,
            Faculty: row.faculty,
            TodaysStatus: <StatusBadge status={row.status} />,
            statusRaw: row.status,
            ClassAttendance: row.classAttendance,
            Percentage: row.percentage,
        })) || [];

    const formattedDate = viewDate.toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });
    const isToday = viewDate.toDateString() === new Date().toDateString();

    return (
        <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F5F5F5]">
            <ScrollView
                className="flex-1 bg-[#f4f5f6] "
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 140, paddingTop: headerHeight + 16 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                alwaysBounceVertical={true}
                overScrollMode="always"
            >
                <View className="px-4 pt-4">
                    {!showSubjectAttendanceTable && !showSubjectAttendanceDetails && (
                        <>
                            <View className="mb-4">
                                <Text className="text-[#282828] text-[22px] mb-1" style={{ fontFamily: fonts.bold }}>
                                    {t("Attendance")}
                                </Text>
                                <Text className="text-gray-600 text-[13px]" style={{ fontFamily: fonts.regular }}>
                                    {t("Track, manage, and maintain your attendance effortlessly")}
                                </Text>
                            </View>

                            {dataLoading ? (
                                <DashboardSkeleton />
                            ) : (
                                <View className="flex-col gap-3 w-full">
                                    <View className="flex-row gap-3 w-full">
                                        <CardComponent
                                            style="bg-[#FFEDDA] flex-1 h-[95px] rounded-xl"
                                            icon={<UsersThree size={28} color="#FFFFFF" weight="fill" />}
                                            value={
                                                dashboardData
                                                    ? `${dashboardData.todayStats.attended}/${dashboardData.todayStats.total}`
                                                    : "0/0"
                                            }
                                            label={t("Today Total Classes")}
                                            iconBgColor="#FFBB70"
                                            iconColor="#FFFFFF"
                                        />

                                        <CardComponent
                                            style="bg-[#CEE6FF] flex-1 h-[95px] rounded-xl"
                                            icon={<Chalkboard size={28} color="#FFFFFF" weight="fill" />}
                                            value={
                                                dashboardData
                                                    ? `${dashboardData.cards.attended}/${dashboardData.cards.totalClasses}`
                                                    : "0/0"
                                            }
                                            label={t("Sem Attendance")}
                                            iconBgColor="#7764FF"
                                            iconColor="#FFFFFF"
                                            totalPercentage={
                                                dashboardData
                                                    ? `${dashboardData.cards.percentage}%`
                                                    : "0%"
                                            }
                                            onClick={() => handleCardClick(2)}
                                        />
                                    </View>

                                    <View className="w-full">
                                        <SemesterAttendanceCard
                                            presentPercent={dashboardData?.semesterStats.present || 0}
                                            absentPercent={dashboardData?.semesterStats.absent || 0}
                                            leavePercent={dashboardData?.semesterStats.leave || 0}
                                            overallPercent={dashboardData?.cards.percentage || 0}
                                        />
                                    </View>
                                </View>
                            )}

                            <View className="mt-3">
                                <AiAttendanceNotificationBanner
                                    className="min-h-[70px] py-4"
                                    message={
                                        dashboardData?.attendancePolicyInsight?.message ||
                                        "Attendance insight will appear once records are available."
                                    }
                                />
                            </View>

                            <View className="mt-3 p-3">
                                <Text className="text-[#282828] text-[17px]" style={{ fontFamily: fonts.semiBold }}>
                                    {isToday
                                        ? t("Today's Attendance")
                                        : t("Attendance – {date}", { date: formattedDate })}
                                </Text>
                                <Text className="text-gray-500 text-[13px] mt-0.5" style={{ fontFamily: fonts.regular }}>
                                    {t("Classes on {date}", { date: formattedDate })}
                                </Text>

                                {dataLoading ? (
                                    <View className="mt-5">
                                        <TableSkeleton />
                                    </View>
                                ) : (
                                    <>
                                        <View className="flex-col mt-3 w-full">
                                            {tableRows.map((row, i) => {
                                                const isExpanded = expandedRow === i;
                                                const isLast = i === tableRows.length - 1;

                                                return (
                                                    <View
                                                        key={i}
                                                        className={`overflow-hidden${!isLast ? " border-b border-gray-100" : ""}`}
                                                    >
                                                        <TouchableOpacity
                                                            className="py-3 flex-row justify-between items-center"
                                                            activeOpacity={0.7}
                                                            onPress={() => toggleRow(i)}
                                                        >
                                                            <View className="flex-1 flex-col gap-0.5">
                                                                <Text className="text-[#515151] text-[11px]" style={{ fontFamily: fonts.regular }}>
                                                                    {t("Subject Name")}
                                                                </Text>
                                                                <Text
                                                                    className="text-[14px] text-[#282828] pr-2"
                                                                    numberOfLines={1}
                                                                    style={{ fontFamily: fonts.medium }}
                                                                >
                                                                    {row.Subject}
                                                                </Text>
                                                            </View>

                                                            <View className="flex-row items-center gap-2">
                                                                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                                                                    <Text className="text-blue-500 text-[9px]" style={{ fontFamily: fonts.bold }}>
                                                                        PDF
                                                                    </Text>
                                                                </View>
                                                                <View className="w-6 h-6 rounded-full bg-[#43C17A] items-center justify-center">
                                                                    <CaretDown
                                                                        size={14}
                                                                        color="#FFFFFF"
                                                                        weight="bold"
                                                                        style={{
                                                                            transform: [
                                                                                { rotate: isExpanded ? "180deg" : "0deg" },
                                                                            ],
                                                                        }}
                                                                    />
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>

                                                        {isExpanded && (
                                                            <View className="pb-3 flex-col gap-2.5 px-2 pt-1 rounded-lg mb-1">
                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] text-[13px]" style={{ fontFamily: fonts.medium }}>
                                                                        {t("Faculty")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]" style={{ fontFamily: fonts.regular }}>
                                                                        {row.Faculty}
                                                                    </Text>
                                                                </View>

                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] text-[13px]" style={{ fontFamily: fonts.medium }}>
                                                                        {t("Today's Status")}
                                                                    </Text>
                                                                    <View className="px-3 py-0.5 bg-[#DCEAE2] rounded-full">
                                                                        <Text style={{ fontFamily: fonts.medium }}>
                                                                            {row.TodaysStatus}
                                                                        </Text>
                                                                    </View>
                                                                </View>

                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] text-[13px]" style={{ fontFamily: fonts.medium }}>
                                                                        {t("Class Attendance")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]" style={{ fontFamily: fonts.regular }}>
                                                                        {row.ClassAttendance}
                                                                    </Text>
                                                                </View>

                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] text-[13px]" style={{ fontFamily: fonts.medium }}>
                                                                        {t("Percentage %")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]" style={{ fontFamily: fonts.regular }}>
                                                                        {row.Percentage}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>

                                        {totalPages > 1 && (
                                            <View className="flex-row justify-end items-center gap-2 mt-6 mb-4 w-full">
                                                <TouchableOpacity
                                                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className={`w-10 h-10 items-center justify-center rounded-lg border ${currentPage === 1 ? "border-gray-200" : "border-gray-300 bg-white"
                                                        }`}
                                                >
                                                    <Text className={currentPage === 1 ? "text-gray-300 text-lg" : "text-gray-600 text-lg"}>
                                                        ‹
                                                    </Text>
                                                </TouchableOpacity>

                                                {[...Array(totalPages)].map((_, i) => (
                                                    <TouchableOpacity
                                                        key={i}
                                                        onPress={() => setCurrentPage(i + 1)}
                                                        className={`w-8 h-8 rounded-lg items-center justify-center ${currentPage === i + 1
                                                            ? "bg-[#16284F]"
                                                            : "border border-gray-300 bg-white"
                                                            }`}
                                                    >
                                                        <Text className={`font-semibold text-[13px] ${currentPage === i + 1 ? "text-white" : "text-gray-600"
                                                            }`}>
                                                            {i + 1}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}

                                                <TouchableOpacity
                                                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className={`w-10 h-10 items-center justify-center rounded-lg border ${currentPage === totalPages ? "border-gray-200" : "border-gray-300 bg-white"
                                                        }`}
                                                >
                                                    <Text className={currentPage === totalPages ? "text-gray-300 text-lg" : "text-gray-600 text-lg"}>
                                                        ›
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {tableRows.length === 0 && (
                                            <View className="mt-4 border border-gray-200 p-4 rounded-lg bg-white items-center">
                                                <Text className="text-gray-400 italic text-[13px] text-center">
                                                    {t("No classes scheduled for {date}", { date: formattedDate })}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </>
                    )}

                    {showSubjectAttendanceTable && (
                        <SubjectAttendance
                            onBack={() => setCurrentTab(null)}
                            onNavigate={(screen, params) => {
                                if (screen === "SubjectDetails") {
                                    setSelectedSubjectId(params?.subjectId ? Number(params.subjectId) : null);
                                    setCurrentTab("subject-attendance-details");
                                }
                            }}
                        />
                    )}
                    {showSubjectAttendanceDetails && (
                        <SubjectAttendanceDetailsClient
                            route={{ params: { subjectId: selectedSubjectId } }}
                            navigation={{ goBack: () => setCurrentTab("subject-attendance") }}
                        />
                    )}

                    {!hideRightSection && Platform.OS === "web" && (
                        <View className="w-[32%] flex-col gap-3 p-2 pt-0">
                            <CourseScheduleCard />
                            <WorkWeekCalendar activeDate={viewDate} onDateSelect={setViewDate} />
                            <View className="mt-5">
                                <AttendanceInsight
                                    weeklyData={dashboardData?.weeklyData || [0, 0, 0, 0, 0, 0, 0]}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
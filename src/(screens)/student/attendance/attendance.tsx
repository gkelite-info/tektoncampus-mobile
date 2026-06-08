"use client";
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    LayoutAnimation,
    UIManager,
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

if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type DashboardData = Awaited<ReturnType<typeof getStudentDashboardData>>;

interface TableRow {
    Subject: string;
    Faculty: string;
    TodaysStatus: React.ReactNode;
    statusRaw: string;
    ClassAttendance: string;
    Percentage: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── StatusBadge ─────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AttendanceClient() {
    const t = useTranslations("Attendance.student");

    const [currentTab, setCurrentTab] = useState<string | null>(null);
    const showSubjectAttendanceTable = currentTab === "subject-attendance";
    const showSubjectAttendanceDetails =
        currentTab === "subject-attendance-details";
    const hideRightSection =
        showSubjectAttendanceTable || showSubjectAttendanceDetails;

    const [dataLoading, setDataLoading] = useState(false);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(
        null
    );
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

    // ─── Data fetch ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (userLoading || studentLoading) return;
        if (!userId) {
            setDataLoading(false);
            return;
        }
        let isMounted = true;

        async function fetchData() {
            try {
                setDataLoading(true);
                setTableLoading(true);

                const year = viewDate.getFullYear();
                const month = String(viewDate.getMonth() + 1).padStart(2, "0");
                const day = String(viewDate.getDate()).padStart(2, "0");
                const dateStr = `${year}-${month}-${day}`;

                const data = await getStudentDashboardData(
                    userId!,
                    dateStr,
                    currentPage,
                    rowsPerPage,
                    isInter
                );

                if (isMounted) {
                    setDashboardData(data);
                    setTotalRecords(data.totalCount || 0);
                }
            } catch {
                // silent
            } finally {
                if (isMounted) {
                    setDataLoading(false);
                    setTableLoading(false);
                }
            }
        }

        fetchData();
        return () => {
            isMounted = false;
        };
    }, [userId, viewDate, currentPage, isInter, userLoading, studentLoading]);

    // ─── Handlers ─────────────────────────────────────────────────────────────

    const handleCardClick = (cardId: number) => {
        if (cardId === 2) setCurrentTab("subject-attendance");
    };

    const toggleRow = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedRow(expandedRow === index ? null : index);
    };

    // ─── Derived ──────────────────────────────────────────────────────────────

    const tableRows: TableRow[] =
        dashboardData?.tableData?.map((row) => ({
            Subject: row.subject,
            Faculty: row.faculty,
            TodaysStatus: <StatusBadge status={row.status} />,
            statusRaw: row.status,
            ClassAttendance: row.classAttendance,
            Percentage: row.percentage,
        })) || [];

    const dynamicCards = [
        {
            id: 1,
            icon: <UsersThree size={32} color="#EFEFEF" />,
            value: dashboardData
                ? `${dashboardData.todayStats.attended}/${dashboardData.todayStats.total}`
                : "0/0",
            label: t("Today Total Classes"),
            style: "bg-[#FFEDDA] w-44",
            iconBgColor: "#FFBB70",
            iconColor: "#EFEFEF",
        },
        {
            id: 2,
            icon: <Chalkboard size={32} color="#EFEFEF" />,
            value: dashboardData
                ? `${dashboardData.cards.attended}/${dashboardData.cards.totalClasses}`
                : "0/0",
            label: t("Sem Attendance"),
            style: "bg-[#CEE6FF] w-44",
            iconBgColor: "#7764FF",
            iconColor: "#EFEFEF",
            totalPercentage: dashboardData
                ? `${dashboardData.cards.percentage}%`
                : "0%",
        },
    ];

    const formattedDate = viewDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    const isToday = viewDate.toDateString() === new Date().toDateString();

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <ScrollView
            className="flex-1 bg-[#f4f5f6]"
            showsVerticalScrollIndicator={false}
        >
            <View className="flex-1 w-full p-4 min-h-screen">

                {/* ── Main column ──────────────────────────────────────────────── */}
                <View className="flex-col gap-4 w-full">

                    {!showSubjectAttendanceTable && !showSubjectAttendanceDetails && (
                        <>
                            {/* ── Header ── */}
                            <View className="mb-2">
                                <Text className="text-[#282828] font-bold text-[22px] mb-1">
                                    {t("Attendance")}
                                </Text>
                                <Text className="text-gray-600 text-[13px]">
                                    {t(
                                        "Track, manage, and maintain your attendance effortlessly"
                                    )}
                                </Text>
                            </View>

                            {/* ── Cards + Semester block ── */}
                            {dataLoading ? (
                                <DashboardSkeleton />
                            ) : (
                                <View className="flex-col gap-3">
                                    {/* 2-column card grid — mirrors web's grid-cols-2 */}
                                    <View className="flex-row gap-3">
                                        {dynamicCards.map((card) => (
                                            <TouchableOpacity
                                                key={card.id}
                                                className="flex-1"
                                                activeOpacity={card.id === 2 ? 0.7 : 1}
                                                onPress={
                                                    card.id === 2
                                                        ? () => handleCardClick(card.id)
                                                        : undefined
                                                }
                                            >
                                                <CardComponent
                                                    style={card.style}
                                                    icon={card.icon}
                                                    value={card.value}
                                                    label={card.label}
                                                    iconBgColor={card.iconBgColor}
                                                    iconColor={card.iconColor}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Semester attendance — full width below */}
                                    <View className="w-full">
                                        <SemesterAttendanceCard
                                            presentPercent={
                                                dashboardData?.semesterStats.present || 0
                                            }
                                            absentPercent={
                                                dashboardData?.semesterStats.absent || 0
                                            }
                                            leavePercent={dashboardData?.semesterStats.leave || 0}
                                            overallPercent={dashboardData?.cards.percentage || 0}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* ── AI Insight Banner ── */}
                            <View className="my-2">
                                <AiAttendanceNotificationBanner
                                    className="h-auto min-h-[70px] py-4"
                                    message={
                                        dashboardData?.attendancePolicyInsight?.message ||
                                        "Attendance insight will appear once records are available."
                                    }
                                />
                            </View>

                            {/* ── Attendance list section ── */}
                            <View className="flex-col p-3">
                                {/* Section title */}
                                <Text className="text-[#282828] font-semibold text-[17px]">
                                    {isToday
                                        ? t("Today's Attendance")
                                        : t("Attendance – {date}", { date: formattedDate })}
                                </Text>
                                <Text className="text-gray-500 text-[13px] mt-0.5">
                                    {t("Classes on {date}", { date: formattedDate })}
                                </Text>

                                {dataLoading ? (
                                    <View className="mt-5">
                                        <TableSkeleton />
                                    </View>
                                ) : (
                                    <>
                                        {/* ── Accordion rows (mobile table replacement) ── */}
                                        <View className="flex-col mt-3 w-full">
                                            {tableRows.map((row, i) => {
                                                const isExpanded = expandedRow === i;
                                                const isLast = i === tableRows.length - 1;

                                                return (
                                                    <View
                                                        key={i}
                                                        className={`overflow-hidden ${!isLast ? "border-b border-gray-100" : ""}`}
                                                    >
                                                        {/* ── Collapsed header row ── */}
                                                        <TouchableOpacity
                                                            className="py-3 flex-row justify-between items-center"
                                                            activeOpacity={0.7}
                                                            onPress={() => toggleRow(i)}
                                                        >
                                                            {/* Left: label + subject name */}
                                                            <View className="flex-col gap-0.5 flex-1">
                                                                <Text className="text-[#515151] text-[11px]">
                                                                    {t("Subject Name")}
                                                                </Text>
                                                                <Text
                                                                    className="text-[14px] text-[#282828] font-medium pr-2"
                                                                    numberOfLines={1}
                                                                >
                                                                    {row.Subject}
                                                                </Text>
                                                            </View>

                                                            {/* Right: PDF chip + caret */}
                                                            <View className="flex-row items-center gap-2 shrink-0">
                                                                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                                                                    <Text className="text-blue-500 text-[9px] font-bold">
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
                                                                                {
                                                                                    rotate: isExpanded
                                                                                        ? "180deg"
                                                                                        : "0deg",
                                                                                },
                                                                            ],
                                                                        }}
                                                                    />
                                                                </View>
                                                            </View>
                                                        </TouchableOpacity>

                                                        {/* ── Expanded detail panel ── */}
                                                        {isExpanded && (
                                                            <View className="pb-3 flex-col gap-2.5 bg-gray-50/50 px-2 pt-1 rounded-lg mb-1">
                                                                {/* Faculty */}
                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] font-medium text-[13px]">
                                                                        {t("Faculty")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]">
                                                                        {row.Faculty}
                                                                    </Text>
                                                                </View>

                                                                {/* Today's Status */}
                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] font-medium text-[13px]">
                                                                        {t("Today's Status")}
                                                                    </Text>
                                                                    <View className="px-3 py-0.5 bg-[#DCEAE2] rounded-full">
                                                                        {row.TodaysStatus}
                                                                    </View>
                                                                </View>

                                                                {/* Class Attendance */}
                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] font-medium text-[13px]">
                                                                        {t("Class Attendance")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]">
                                                                        {row.ClassAttendance}
                                                                    </Text>
                                                                </View>

                                                                {/* Percentage */}
                                                                <View className="flex-row justify-between items-center">
                                                                    <Text className="text-[#282828] font-medium text-[13px]">
                                                                        {t("Percentage %")}
                                                                    </Text>
                                                                    <Text className="text-gray-600 text-[13px]">
                                                                        {row.Percentage}
                                                                    </Text>
                                                                </View>
                                                            </View>
                                                        )}
                                                    </View>
                                                );
                                            })}
                                        </View>

                                        {/* ── Pagination ── */}
                                        {totalPages > 1 && (
                                            <View className="flex-row justify-end items-center gap-2 mt-6 mb-4 w-full">
                                                {/* Prev */}
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        setCurrentPage((p) => Math.max(1, p - 1))
                                                    }
                                                    disabled={currentPage === 1}
                                                    className={`w-10 h-10 items-center justify-center rounded-lg border ${currentPage === 1
                                                        ? "border-gray-200"
                                                        : "border-gray-300 bg-white"
                                                        }`}
                                                >
                                                    <Text
                                                        className={
                                                            currentPage === 1
                                                                ? "text-gray-300 text-lg"
                                                                : "text-gray-600 text-lg"
                                                        }
                                                    >
                                                        ‹
                                                    </Text>
                                                </TouchableOpacity>

                                                {/* Page numbers */}
                                                {[...Array(totalPages)].map((_, i) => (
                                                    <TouchableOpacity
                                                        key={i}
                                                        onPress={() => setCurrentPage(i + 1)}
                                                        className={`w-8 h-8 rounded-lg items-center justify-center ${currentPage === i + 1
                                                            ? "bg-[#16284F]"
                                                            : "border border-gray-300 bg-white"
                                                            }`}
                                                    >
                                                        <Text
                                                            className={`font-semibold text-[13px] ${currentPage === i + 1
                                                                ? "text-white"
                                                                : "text-gray-600"
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}

                                                {/* Next */}
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        setCurrentPage((p) =>
                                                            Math.min(totalPages, p + 1)
                                                        )
                                                    }
                                                    disabled={currentPage === totalPages}
                                                    className={`w-10 h-10 items-center justify-center rounded-lg border ${currentPage === totalPages
                                                        ? "border-gray-200"
                                                        : "border-gray-300 bg-white"
                                                        }`}
                                                >
                                                    <Text
                                                        className={
                                                            currentPage === totalPages
                                                                ? "text-gray-300 text-lg"
                                                                : "text-gray-600 text-lg"
                                                        }
                                                    >
                                                        ›
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* ── Empty state ── */}
                                        {tableRows.length === 0 && (
                                            <View className="mt-4 border border-gray-200 p-4 rounded-lg bg-white items-center">
                                                <Text className="text-gray-400 italic text-[13px] text-center">
                                                    {t("No classes scheduled for {date}", {
                                                        date: formattedDate,
                                                    })}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </>
                    )}

                    {/* ── Sub-page tabs ── */}
                    {showSubjectAttendanceTable && <SubjectAttendance />}
                    {showSubjectAttendanceDetails && <SubjectAttendanceDetailsClient />}
                </View>

                {/* ── Desktop side panel — web only ──────────────────────────── */}
                {!hideRightSection && Platform.OS === "web" && (
                    <View className="w-[32%] flex-col gap-3 p-2 pt-0">
                        <CourseScheduleCard />
                        <WorkWeekCalendar
                            activeDate={viewDate}
                            onDateSelect={setViewDate}
                        />
                        <View className="mt-5">
                            <AttendanceInsight
                                weeklyData={
                                    dashboardData?.weeklyData || [0, 0, 0, 0, 0, 0, 0]
                                }
                            />
                        </View>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
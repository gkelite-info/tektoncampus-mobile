import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions
} from "react-native";
import { CaretLeft, Chalkboard, CaretDown } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

const useNavigate = () => {
    return {
        navigate: (screen: string, params?: any) => console.log(`Navigating to ${screen}`, params),
        goBack: () => console.log("Going back")
    };
};

const useUser = () => ({ userId: "student_123", loading: false });
const useTranslations = (namespace: string) => (key: string) => key;
const getStudentDashboardData = async (...args: any[]): Promise<any> => ({
    cards: { attended: 12, totalClasses: 15, percentage: 80 },
    semesterStats: { present: 75, absent: 15, leave: 10 },
    subjectWiseStats: [
        { subjectId: "1", subjectName: "Mathematics", total: 30, attended: 25, missed: 3, leave: 2, percentage: 83 },
        { subjectId: "2", subjectName: "Computer Science", total: 28, attended: 24, missed: 4, leave: 0, percentage: 85 }
    ],
    totalCount: 2,
    attendancePolicyInsight: { message: "Maintain above 75% to stay eligible for exams." }
});

const CardComponent = ({ label, value, totalPercentage, style, icon }: any) => (
    <View className={`p-4 rounded-xl shadow-sm bg-amber-50 mb-2 ${style}`}>
        {icon}
        <Text className="text-xl mt-2 text-[#282828]" style={{ fontFamily: fonts.bold }}>{value}</Text>
        {totalPercentage && <Text className="text-md text-emerald-600" style={{ fontFamily: fonts.semiBold }}>{totalPercentage}</Text>}
        <Text className="text-sm text-gray-500 mt-1" style={{ fontFamily: fonts.regular }}>{label}</Text>
    </View>
);
const CourseScheduleCard = ({ style }: any) => <View className={`bg-gray-100 p-4 rounded-xl ${style}`}><Text>Schedule Card</Text></View>;
const SemesterAttendanceCard = ({ presentPercent }: any) => <View className="bg-emerald-50 p-4 rounded-xl"><Text style={{ fontFamily: fonts.semiBold }} className="text-base">Semester Stats: {presentPercent}%</Text></View>;
const WorkWeekCalendar = ({ style }: any) => <View className={`bg-gray-50 p-4 rounded-xl ${style}`}><Text>Calendar Section</Text></View>;
const AiAttendanceNotificationBanner = ({ message }: any) => (
    <View className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl"><Text className="text-indigo-900 text-xs font-medium">{message}</Text></View>
);
const TableComponent = ({ tableData }: any) => <View className="p-4 bg-gray-50 rounded-xl"><Text>Desktop Data View Grid</Text></View>;

interface CardItem {
    id: number;
    icon: React.ReactNode;
    value: string | number;
    label: string;
    style?: string;
    iconBgColor?: string;
    iconColor?: string;
    underlineValue?: boolean;
    totalPercentage?: string | number;
}

export default function SubjectAttendance({ onBack, onNavigate }: { onBack?: () => void; onNavigate?: (screen: string, params?: any) => void }) {
    const router = useNavigate();
    const t = useTranslations("Attendance.student");
    const { width } = useWindowDimensions();
    const isDesktopView = width >= 768;

    const { userId, loading: userLoading } = useUser();
    const [dashboardData, setDashboardData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const rowsPerPage = 10;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    useEffect(() => {
        if (userLoading || !userId) return;

        async function loadData() {
            setLoading(true);
            const today = new Date();
            const dateStr = today.toISOString().split("T")[0];

            const data = await getStudentDashboardData(userId, dateStr, currentPage, rowsPerPage);
            setDashboardData(data);
            setTotalRecords(data.totalCount || 0);
            setLoading(false);
        }

        loadData();
    }, [userId, currentPage, userLoading]);

    const cards: CardItem[] = [
        {
            id: 1,
            icon: <Chalkboard size={28} color="#282828" />,
            value: dashboardData ? `${dashboardData.cards.attended}/${dashboardData.cards.totalClasses}` : "0/0",
            label: t("Today Total Classes"),
            style: "bg-[#FFEDDA]",
        },
        {
            id: 2,
            icon: <Chalkboard size={28} color="#282828" />,
            value: dashboardData ? `${dashboardData.cards.attended}/${dashboardData.cards.totalClasses}` : "0/0",
            label: t("Semester Attendance"),
            style: "bg-[#FFEDDA]",
            totalPercentage: dashboardData ? `${dashboardData.cards.percentage}%` : "0%",
        },
    ];

    const rawTableData = dashboardData?.subjectWiseStats || [];

    return (
        <View className="flex-1">
            <View className="flex-row justify-between items-center w-full">
                <View className="flex-col flex-1 pr-2">
                    <View className="flex-row items-center gap-1">
                        <TouchableOpacity onPress={onBack || (() => router.goBack())} className="p-1 -ml-2">
                            <CaretLeft size={24} color="#282828" weight="bold" />
                        </TouchableOpacity>
                        <Text className="text-[#282828] text-2xl" style={{ fontFamily: fonts.bold }}>{t("Attendance")}</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mt-0.5" style={{ fontFamily: fonts.regular }}>
                        {t("Track, manage, and maintain your attendance effortlessly")}
                    </Text>
                </View>

                {isDesktopView && (
                    <View className="w-[320px]">
                        <CourseScheduleCard style="w-full" />
                    </View>
                )}
            </View>

            <View className={`w-full mt-4 gap-3 ${isDesktopView ? "flex-row items-start" : "flex-col"}`}>
                <View className={`gap-3 ${isDesktopView ? "flex-row flex-1" : "flex-row w-full justify-between"}`}>
                    {cards.map((card, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-1"
                            onPress={() => card.id === 1 && router.navigate("AttendanceRoot")}
                        >
                            <CardComponent
                                style={card.style}
                                icon={card.icon}
                                value={card.value}
                                label={card.label}
                                totalPercentage={card.totalPercentage}
                            />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className={isDesktopView ? "flex-1" : "w-full"}>
                    <SemesterAttendanceCard
                        presentPercent={dashboardData?.semesterStats.present || 0}
                        absentPercent={dashboardData?.semesterStats.absent || 0}
                        leavePercent={dashboardData?.semesterStats.leave || 0}
                        overallPercent={dashboardData?.cards.percentage || 0}
                    />
                </View>

                {isDesktopView && <WorkWeekCalendar style="w-[325px]" />}
            </View>

            <View className="my-3 w-full">
                <AiAttendanceNotificationBanner
                    message={dashboardData?.attendancePolicyInsight?.message || "Attendance insight will appear once records are available."}
                />
            </View>

            <View className="mt-2 flex-col items-start w-full">
                <Text className="text-[#282828] text-lg" style={{ fontFamily: fonts.semiBold }}>{t("Subject-Wise Breakdown")}</Text>
                {isDesktopView ? (
                    <View className="w-full mt-2">
                        <TableComponent tableData={rawTableData} isLoading={loading} />
                    </View>
                ) : (
                    <View className="w-full flex-col mt-2">
                        {loading ? (
                            <View className="flex justify-center p-6 w-full">
                                <ActivityIndicator size="small" color="#16284F" />
                            </View>
                        ) : (
                            rawTableData.map((row: any, i: number) => {
                                const isExpanded = expandedRow === i;
                                return (
                                    <View key={i} className="border-b border-gray-100 w-full">
                                        <TouchableOpacity
                                            className="py-3 flex-row justify-between items-center w-full"
                                            onPress={() => setExpandedRow(isExpanded ? null : i)}
                                        >
                                            <View className="flex-col flex-1 pr-2">
                                                <Text className="text-gray-400 text-base font-medium uppercase tracking-wider">{t("Subject Name")}</Text>
                                                <Text className="text-base text-[#282828] mt-0.5" numberOfLines={1} style={{ fontFamily: fonts.semiBold }}>
                                                    {row.subjectName}
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center gap-2">
                                                <View className="w-7 h-7 rounded-full bg-blue-50 items-center justify-center">
                                                    <Text className="text-blue-500 text-sm font-black">PDF</Text>
                                                </View>
                                                <View className="w-7 h-7 rounded-full bg-[#43C17A] items-center justify-center">
                                                    <CaretDown
                                                        size={14}
                                                        color="#FFFFFF"
                                                        style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                                                    />
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        {isExpanded && (
                                            <View className="pb-4 pt-1 px-1 flex-col gap-2 bg-gray-50/50 rounded-lg mb-2">
                                                {[
                                                    { label: t("Total"), value: row.total },
                                                    { label: t("Attended"), value: row.attended },
                                                    { label: t("Missed"), value: row.missed },
                                                    { label: t("Leave"), value: row.leave },
                                                    { label: t("Percentage %"), value: `${row.percentage}%`, highlight: true }
                                                ].map((item, idx) => (
                                                    <View key={idx} className="flex-row justify-between items-center py-0.5">
                                                        <Text className="text-gray-500 text-base" style={{ fontFamily: fonts.medium }}>{item.label}</Text>
                                                        <Text className={`text-base ${item.highlight ? "text-emerald-600 font-bold" : "text-gray-800 font-semibold"}`}>
                                                            {item.value}
                                                        </Text>
                                                    </View>
                                                ))}
                                                <TouchableOpacity
                                                    className="mt-2 items-end"
                                                    onPress={() => (onNavigate || router.navigate)("SubjectDetails", { subjectId: row.subjectId })}
                                                >
                                                    <Text className="text-indigo-600 underline text-base" style={{ fontFamily: fonts.semiBold }}>{t("View Details")}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                {totalPages > 1 && (
                    <View className="flex-row justify-end items-center gap-2 mt-6 mb-8 w-full">
                        <TouchableOpacity
                            onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`w-9 h-9 items-center justify-center rounded-lg border ${currentPage === 1 ? "border-gray-200" : "border-gray-300 bg-white"
                                }`}
                        >
                            <Text style={{ color: currentPage === 1 ? "#D1D5DB" : "#4B5563" }} className="text-sm">‹</Text>
                        </TouchableOpacity>

                        {Array.from({ length: totalPages }).map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => setCurrentPage(i + 1)}
                                className={`w-9 h-9 items-center justify-center rounded-lg ${currentPage === i + 1 ? "bg-[#16284F]" : "border border-gray-300 bg-white"
                                    }`}
                            >
                                <Text className={`text-xs font-bold ${currentPage === i + 1 ? "text-white" : "text-gray-600"}`}>
                                    {i + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className={`w-9 h-9 items-center justify-center rounded-lg border ${currentPage === totalPages ? "border-gray-200" : "border-gray-300 bg-white"
                                }`}
                        >
                            <Text style={{ color: currentPage === totalPages ? "#D1D5DB" : "#4B5563" }} className="text-sm">›</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
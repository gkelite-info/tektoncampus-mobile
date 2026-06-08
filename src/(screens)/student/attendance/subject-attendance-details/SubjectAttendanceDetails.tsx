import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions
} from "react-native";
import { CaretLeft, Chalkboard, Percent } from "phosphor-react-native";

type ViewFilter = "ALL" | "ATTENDED" | "ABSENT" | "LEAVE";

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

const StatusBadge = ({ status, t }: { status: string; t: (key: string) => string }) => {
    let bg = "#E5E5E5";
    let color = "#525252";

    switch (status) {
        case "Present":
            bg = "#43C17A3D";
            color = "#00A652";
            break;
        case "Absent":
            bg = "#FFE0E0";
            color = "#FF2020";
            break;
        case "Late":
            bg = "#FFEDDA";
            color = "#FFBB70";
            break;
    }

    return (
        <View className="w-[85px] h-[26px] items-center justify-center rounded-lg" style={{ backgroundColor: bg }}>
            <Text style={{ color: color }} className="text-xs font-semibold">
                {t(status)}
            </Text>
        </View>
    );
};

export default function SubjectAttendanceDetailsClient({ route, navigation }: any) {
    const { width } = useWindowDimensions();
    const isDesktopView = width >= 768;

    const subjectId = route?.params?.subjectId ? Number(route.params.subjectId) : null;

    const t = (key: string) => key;
    const userId = "student_123";

    const [activeView, setActiveView] = useState<ViewFilter>("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);

    const rowsPerPage = 10;
    const totalPages = Math.ceil(totalRecords / rowsPerPage);

    const getStudentAttendanceDetails = async (...args: any[]): Promise<any> => ({
        subjectName: "Data Structures",
        facultyName: "Dr. Alex Martinez",
        headerStats: { total: 40, attended: 32, absent: 6, leave: 2, percentage: 80 },
        totalCount: 3,
        rows: [
            { date: "2026-06-01", time: "09:00 AM", status: "PRESENT", reason: "" },
            { date: "2026-06-03", time: "09:00 AM", status: "ABSENT", reason: "Medical" },
            { date: "2026-06-05", time: "09:00 AM", status: "LEAVE", reason: "Approved Leave" }
        ],
        attendancePolicyInsight: { message: "Looking good! Keep this consistency up to secure your terms." }
    });

    useEffect(() => {
        if (!userId || !subjectId) return;

        async function loadDetails() {
            try {
                setLoading(true);
                const res = await getStudentAttendanceDetails({
                    userId,
                    subjectId,
                    statusFilter: activeView,
                    page: currentPage,
                    limit: rowsPerPage,
                });

                setData(res);
                setTotalRecords(res.totalCount || 0);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        loadDetails();
    }, [userId, subjectId, activeView, currentPage]);

    const cards: CardItem[] = [
        { id: 1, icon: <Chalkboard size={24} color="#714EF2" weight="fill" />, value: data?.headerStats.total ?? 0, label: t("Total Classes"), style: "bg-[#E2DAFF]" },
        { id: 2, icon: <Chalkboard size={24} color="#FFBC72" weight="fill" />, value: data?.headerStats.attended ?? 0, label: t("Attended"), style: "bg-[#FFEDDA]" },
        { id: 3, icon: <Chalkboard size={24} color="#F62D2D" weight="fill" />, value: data?.headerStats.leave ?? 0, label: t("Leave"), style: "bg-[#FFE0E0]" },
        { id: 4, icon: <Percent size={24} color="#60AEFF" weight="fill" />, value: `${data?.headerStats.percentage ?? 0}%`, label: t("Attendance"), style: "bg-[#CEE6FF]" },
    ];

    function normalizeStatus(status: string) {
        if (status === "PRESENT") return "Present";
        if (status === "ABSENT") return "Absent";
        if (status === "LATE") return "Late";
        if (status === "LEAVE") return "Leave";
        return status;
    }

    const handleCardPress = (id: number) => {
        if (id === 1) setActiveView("ALL");
        if (id === 2) setActiveView("ATTENDED");
        if (id === 3) setActiveView("LEAVE");
    };

    return (
        <ScrollView className="flex-1 bg-white px-4 pt-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center w-full">
                <View className="flex-col flex-1">
                    <View className="flex-row items-center gap-1">
                        <TouchableOpacity onPress={() => navigation?.goBack()} className="p-1 -ml-2">
                            <CaretLeft size={24} color="#282828" weight="bold" />
                        </TouchableOpacity>
                        <Text className="text-[#282828] font-bold text-xl">{t("Attendance")}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-0.5">
                        {t("Track, manage, and maintain your attendance effortlessly")}
                    </Text>
                </View>
            </View>

            <View className="w-full mt-4 flex-row flex-wrap justify-between gap-y-3">
                {cards.map((card, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => handleCardPress(card.id)}
                        style={{ width: isDesktopView ? "23%" : "48%" }}
                        className={`p-3 rounded-xl flex-col justify-between ${card.style}`}
                    >
                        <View className="w-8 h-8 rounded-full bg-white/60 items-center justify-center">
                            {card.icon}
                        </View>
                        <View className="mt-4">
                            <Text className="text-xl font-bold text-[#282828]">{card.value}</Text>
                            <Text className="text-[11px] text-gray-600 font-medium mt-0.5">{card.label}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="mt-4 w-full bg-indigo-50/60 border border-indigo-100 p-3 rounded-xl">
                <Text className="text-indigo-900 text-xs font-medium">
                    {data?.attendancePolicyInsight?.message || "Attendance insight will appear once records are available."}
                </Text>
            </View>

            <View className="mt-5 w-full">
                <Text className="text-[#282828] font-semibold text-base">{t("Subject Detail View")}</Text>

                <View className="flex-row flex-wrap items-center gap-2 mt-2">
                    <View className="flex-row items-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                        <Text className="text-gray-500 text-xs font-medium mr-1">{t("Subject:")}</Text>
                        <Text className="text-emerald-700 text-xs font-semibold">{data?.subjectName ?? "-"}</Text>
                    </View>

                    <View className="flex-row items-center bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                        <Text className="text-gray-500 text-xs font-medium mr-1">{t("Faculty:")}</Text>
                        <Text className="text-emerald-700 text-xs font-semibold">{data?.facultyName ?? "-"}</Text>
                    </View>
                </View>
            </View>

            <View className="mt-5 w-full">
                <View className="flex-row bg-gray-100 py-2.5 px-3 rounded-t-lg border-b border-gray-200">
                    <Text className="flex-1 text-gray-600 font-bold text-xs">{t("Date")}</Text>
                    <Text className="flex-1 text-gray-600 font-bold text-xs text-center">{t("Time")}</Text>
                    <Text className="flex-1 text-gray-600 font-bold text-xs text-right pr-2">{t("Status")}</Text>
                </View>

                {loading ? (
                    <View className="py-8 items-center justify-center">
                        <ActivityIndicator size="small" color="#16284F" />
                    </View>
                ) : (
                    data?.rows.map((row: any, idx: number) => (
                        <View key={idx} className="flex-row items-center py-3 px-3 border-b border-gray-100 bg-white">
                            <Text className="flex-1 text-gray-800 text-xs font-medium">{row.date}</Text>
                            <Text className="flex-1 text-gray-500 text-xs text-center">{row.time}</Text>
                            <View className="flex-1 items-end">
                                <StatusBadge status={normalizeStatus(row.status)} t={t} />
                            </View>
                        </View>
                    ))
                )}
            </View>

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
        </ScrollView>
    );
}
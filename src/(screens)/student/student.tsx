import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from "react-native";
import tw from "twrnc";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from '@react-navigation/elements';

import {
    BookOpen,
    Clock,
    Users,
    ChevronRight,
} from "lucide-react-native";

import { supabase } from "@/lib/supabaseClient";
import { useTranslation } from "react-i18next";
import UserInfoCard from "@/utils/userInfoCardComp";
import AcademicPerformance from "@/utils/AcademicPerformance";
import CardComponent from "@/utils/card";
import MidExams from "./midExams";
import LectureCard from "@/utils/lectureCard";
import SubjectProgressCards from "../faculty/utils/subjectProgressCard/subjectProgressCards";
import { fetchUpcomingClassesForStudent } from "@/lib/helpers/profile/calender/fetchUpcomingClassesForStudent";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import { fetchAssignmentsForStudent } from "@/lib/helpers/student/assignments/assignmentsAPI";
import { useStudent } from "@/utils/context/student/useStudent";
import { fetchStudentFeePlan } from "@/lib/helpers/student/payments/fetchStudentFeePlan";
import { ValueShimmer } from "@/components/shimmers/valueShimmer";
import { getStudentDashboardData } from "@/lib/helpers/student/attendance/studentAttendanceActions";
import { Chalkboard } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

const nativeToast = {
    error: (msg: string) => console.log(`Toast Error: ${msg}`),
};

const formatTimeToAMPM = (time24: string) => {
    if (!time24) return "";
    const [h, m] = time24.split(":");
    let hour = Number(h);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${m} ${period}`;
};

export default function StudentHome() {
    const [view, setView] = useState<"dashboard" | "exams">("dashboard");
    const [loadingLectures, setLoadingLectures] = useState(true);
    const [lectures, setLectures] = useState<any[]>([]);
    const navigation = useNavigation<any>();
    const headerHeight = useHeaderHeight();

    const [dueAssignmentsCount, setDueAssignmentsCount] = useState(0);
    const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
    const [assignmentsLoading, setAssignmentsLoading] = useState(true);
    const [pendingFeeAmount, setPendingFeeAmount] = useState<number | null>(null);
    const [feeLoading, setFeeLoading] = useState(true);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(true);
    const { studentId } = useStudent();

    const { t } = useTranslation();

    useEffect(() => {
        loadUpcomingClasses();
        loadAssignmentCount();
        loadAttendancePercent();
        loadPendingFee();
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            setSubjectsLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userRow } = await supabase
                .from("users")
                .select("userId")
                .eq("auth_id", user.id)
                .single();
            if (!userRow) return;

            const studentContext = await fetchStudentContext(userRow.userId);

            let query = supabase
                .from("college_subjects")
                .select(`
          collegeSubjectId,
          subjectName,
          image,
          college_subject_units (
            completionPercentage,
            createdBy
          )
        `)
                .eq("collegeBranchId", studentContext.collegeBranchId)
                .eq("collegeEducationId", studentContext.collegeEducationId)
                .eq("collegeAcademicYearId", studentContext.collegeAcademicYearId)
                .eq("isActive", true)
                .is("deletedAt", null);

            if (studentContext.collegeSemesterId !== null && studentContext.collegeSemesterId !== undefined) {
                query = query.eq("collegeSemesterId", studentContext.collegeSemesterId);
            }

            const { data: subjectData } = await query;
            if (!subjectData) {
                setSubjects([]);
                return;
            }

            const facultyIds = new Set<number>();
            subjectData.forEach((sub: any) => {
                sub.college_subject_units?.forEach((unit: any) => {
                    if (unit.createdBy) facultyIds.add(unit.createdBy);
                });
            });

            const facultyMap: Record<number, string> = {};
            if (facultyIds.size > 0) {
                const { data: facultyData } = await supabase
                    .from("faculty")
                    .select("facultyId, fullName")
                    .in("facultyId", Array.from(facultyIds));
                facultyData?.forEach((f: any) => {
                    facultyMap[f.facultyId] = f.fullName;
                });
            }

            const colorPalettes = [
                { radialStart: "#10FD77", radialEnd: "#1C6B3F", remainingColor: "#A1FFCA" },
                { radialStart: "#EFEDFF", radialEnd: "#705CFF", remainingColor: "#E8E4FF" },
                { radialStart: "#FFFFFF", radialEnd: "#FFBE48", remainingColor: "#F7EBD5" },
                { radialStart: "#FEFFFF", radialEnd: "#008993", remainingColor: "#C4FBFF" },
            ];

            const mappedSubjects = subjectData.map((sub: any, index: number) => {
                const units = sub.college_subject_units || [];
                const totalUnits = units.length;

                const avgPercentage = totalUnits > 0
                    ? Math.round(units.reduce((acc: number, curr: any) => acc + (curr.completionPercentage || 0), 0) / totalUnits)
                    : 0;

                const firstUnit = units[0];
                const professor = firstUnit && facultyMap[firstUnit.createdBy]
                    ? t("Prof {name}", { name: facultyMap[firstUnit.createdBy] })
                    : t("Faculty not assigned");
                const colors = colorPalettes[index % colorPalettes.length];

                return {
                    title: sub.subjectName,
                    professor: professor,
                    image: sub.image || "",
                    percentage: avgPercentage,
                    radialStart: colors.radialStart,
                    radialEnd: colors.radialEnd,
                    remainingColor: colors.remainingColor,
                };
            });

            setSubjects(mappedSubjects);
        } catch (err) {
            nativeToast.error("Failed to load subjects");
        } finally {
            setSubjectsLoading(false);
        }
    };

    const loadPendingFee = async () => {
        try {
            setFeeLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userRow } = await supabase
                .from("users")
                .select("userId")
                .eq("auth_id", user.id)
                .single();
            if (!userRow) return;

            const plan = await fetchStudentFeePlan(userRow.userId);
            setPendingFeeAmount(plan?.pendingAmount ?? 0);
        } catch (err) {
            console.error("Failed to load pending fee", err);
        } finally {
            setFeeLoading(false);
        }
    };

    const loadAttendancePercent = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRow } = await supabase
            .from("users")
            .select("userId")
            .eq("auth_id", user.id)
            .single();
        if (!userRow) return;

        const studentContext = await fetchStudentContext(userRow.userId);
        const today = new Date().toISOString().split("T")[0];

        const res = await getStudentDashboardData(
            userRow.userId,
            today,
            1,
            1,
            studentContext.collegeEducationType === "Inter"
        );

        setAttendancePercent(res?.cards?.percentage ?? 0);
    };

    const loadAssignmentCount = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userRow } = await supabase
                .from("users")
                .select("userId")
                .eq("auth_id", user.id)
                .single();
            if (!userRow) return;

            const studentContext = await fetchStudentContext(userRow.userId);

            const res = await fetchAssignmentsForStudent({
                collegeBranchId: studentContext.collegeBranchId,
                collegeAcademicYearId: studentContext.collegeAcademicYearId,
                collegeSectionsId: studentContext.collegeSectionsId,
            }, 1, 1, "active");

            if (res.success) {
                setDueAssignmentsCount(res.totalCount);
            }
        } catch (err) {
            console.error("Failed to load assignment count", err);
        } finally {
            setAssignmentsLoading(false);
        }
    };

    const loadUpcomingClasses = async () => {
        try {
            setLoadingLectures(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No auth user found");

            const { data: userRow, error: userErr } = await supabase
                .from("users")
                .select("userId")
                .eq("auth_id", user.id)
                .single();

            if (userErr || !userRow) throw new Error("Internal user not found");

            const studentContext = await fetchStudentContext(userRow.userId);

            const data = await fetchUpcomingClassesForStudent({
                collegeEducationId: studentContext.collegeEducationId,
                collegeBranchId: studentContext.collegeBranchId,
                collegeAcademicYearId: studentContext.collegeAcademicYearId,
                collegeSemesterId: studentContext.collegeSemesterId,
                collegeSectionId: studentContext.collegeSectionsId,
            });

            setLectures(data);
        } catch (err) {
            console.error("Failed to load classes", err);
        } finally {
            setLoadingLectures(false);
        }
    };

    const cardData = [
        {
            style: "bg-[#E2DAFF] h-[126.35px] w-[46%] rounded-2xl p-4 justify-between",
            icon: <Chalkboard size={32} color="#714EF2" weight="fill" />,
            value: attendancePercent === null ? <ValueShimmer /> : `${attendancePercent}%`,
            label: t("Attendance"),
            to: "Attendance",
        },
        {
            style: "bg-[#FFEDDA] h-[126.35px] w-[46%] rounded-2xl p-4 justify-between",
            icon: <Users size={32} color="#FFBB70" fill="#FFBB70" />,
            value: assignmentsLoading ? <ValueShimmer /> : t("{count} Due", { count: dueAssignmentsCount }),
            label: t("Assignments"),
            to: "Assignments",
        },
        {
            style: "bg-[#E6FBEA] h-[126.35px] w-[46%] rounded-2xl p-4 justify-between",
            icon: <BookOpen size={32} color="#74FF8F" fill="#74FF8F" />,
            value: t("Mid Exams"),
            label: t("N/A"),
            onClick: () => setView("exams"),
        },
        {
            style: "bg-[#CEE6FF] h-[126.35px] w-[46%] rounded-2xl p-4 justify-between",
            icon: <Clock size={32} color="#60AEFF" fill="#60AEFF" />,
            value: feeLoading ? <ValueShimmer /> : `₹${pendingFeeAmount?.toLocaleString("en-IN")}`,
            label: t("Fee Due"),
            to: "Payments",
        },
    ];

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const handleUpcomingClasses = () => {
        navigation.navigate("Calendar");
    };

    const handleSubjectProgress = () => {
        navigation.navigate("Academics");
    };

    const handleLinkPress = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        }
    };

    if (view === "exams") {
        return <MidExams onBack={() => setView("dashboard")} />;
    }

    return (
        <ScrollView style={tw`flex-1 bg-[#f4f5f6]`} contentContainerStyle={[tw`p-4 gap-5 pb-30`, { paddingTop: headerHeight + 16 }]}>
            <View>
                <UserInfoCard />
            </View>

            <View style={tw`flex-row flex-wrap justify-between w-full`}>
                {cardData.map((item: any, index: number) => (
                    <CardComponent
                        key={index}
                        style={item.style}
                        icon={item.icon}
                        value={item.value}
                        label={item.label}
                        onClick={item.onClick ? item.onClick : () => item.to && navigation.navigate(item.to)}
                    />
                ))}
            </View>

            <View style={tw`bg-white rounded-2xl p-4 shadow-sm`}>
                <View style={tw`flex-row justify-between items-center mb-3`}>
                    <Text style={[tw`text-[#282828] text-[17px]`, { fontFamily: fonts.bold }]}>
                        {t("Upcoming Events")}
                    </Text>
                    <TouchableOpacity onPress={handleUpcomingClasses}>
                        <ChevronRight size={20} color="#000000" />
                    </TouchableOpacity>
                </View>

                <View style={tw`gap-3`}>
                    {loadingLectures ? (
                        <View style={tw`flex-row justify-center items-center h-[120px]`}>
                            <ActivityIndicator size="small" color="#16284F" />
                        </View>
                    ) : lectures.length === 0 ? (
                        <View style={tw`min-h-[50px] items-center justify-center`}>
                            <Text style={[tw`text-[#282828] text-sm`, { fontFamily: fonts.regular }]}>
                                {t("No events scheduled")}
                            </Text>
                        </View>
                    ) : (
                        lectures.map((lec: any) => (
                            <View key={lec.calendarEventId} style={tw`relative mb-1`}>
                                <LectureCard
                                    time={`${formatTimeToAMPM(lec.fromTime)}\n-\n${formatTimeToAMPM(lec.toTime)}`}
                                    title={lec.eventTitle}
                                    professor={t("Prof {name}", { name: lec.facultyName })}
                                    description={`${lec.eventTopic} • ${formatDate(lec.date)}`}
                                    status={lec.isCancelled ? t("Cancelled") : ""}
                                />

                                {lec.meetingLink && !lec.isCancelled && (
                                    <TouchableOpacity
                                        activeOpacity={0.8}
                                        onPress={() => handleLinkPress(lec.meetingLink)}
                                        style={tw`absolute right-3 top-1/2 -translate-y-4 bg-[#43C17A] px-3 py-1.5 rounded-md shadow-sm`}
                                    >
                                        <Text style={[tw`text-white text-xs`, { fontFamily: fonts.medium }]}>
                                            {t("Join")}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </View>

            <View style={tw`w-full`}>
                <AcademicPerformance studentId={studentId} />
            </View>

            <View style={tw`w-full`}>
                <SubjectProgressCards
                    props={subjectsLoading ? [] : subjects}
                    isLoading={subjectsLoading}
                    onViewMore={handleSubjectProgress}
                />
            </View>
        </ScrollView>
    );
}
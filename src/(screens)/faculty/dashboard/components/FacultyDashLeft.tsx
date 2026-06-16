import React, { useState, useEffect } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import Toast from 'react-native-toast-message';
import { BookOpen, Chalkboard, ClockAfternoon, UsersThree } from "phosphor-react-native";
import { useAuthStore } from "@/store/authStore";
import { useHeaderHeight } from '@react-navigation/elements';
import { supabase } from "@/lib/supabaseServer";

import { STUDENT_DATA } from "./data";
import { 
    UserInfoCard, 
    CardComponent, 
    StudentPerformanceCard, 
    UpcomingClasses 
} from "@/utils/dashboardCards";

import { getUpcomingClasses, UpcomingLesson } from "@/lib/helpers/faculty/attendance/getClasses";
import { getFacultyDashboardStats } from "@/lib/helpers/faculty/dashboard/getFacultyDashboardStats";
import { handleMissionClassStatus } from "@/lib/helpers/faculty/attendance/attendanceActions";
import { ClassActionModal } from "./ClassActionModal";
import { useNavigation } from "@react-navigation/native";

export default function FacultyDashLeft() {
    const user = useAuthStore((state) => state.user);
    const userId = user?.userId;
    const headerHeight = useHeaderHeight();
    const navigation = useNavigation<any>();

    const [selectedLesson, setSelectedLesson] = useState<UpcomingLesson | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [upcomingClasses, setUpcomingClasses] = useState<UpcomingLesson[]>([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [facultyId, setFacultyId] = useState<number | null>(null);
    const [gender, setGender] = useState<string | null>(null);
    const [facultySubject, setFacultySubject] = useState<string>("");

    const [stats, setStats] = useState({
        totalClasses: 0,
        acceptedClasses: 0,
        totalHours: 0,
        acceptedHours: 0,
        totalStudents: 0,
        presentStudents: 0,
        totalLessons: 0,
        completedLessons: 0,
    });

    const loadData = async () => {
        if (!userId) return;
        try {
            setIsLoadingClasses(true);

            // 1. Fetch user & faculty details dynamically
            const [userRes, facultyRes] = await Promise.all([
                supabase.from("users").select("gender").eq("userId", userId).single(),
                supabase.from("faculty").select("facultyId").eq("userId", userId).single()
            ]);

            const currentFacultyId = facultyRes.data?.facultyId;
            setGender(userRes.data?.gender || "Female");

            if (currentFacultyId) {
                setFacultyId(currentFacultyId);

                
                const { data: subjectData } = await supabase
                    .from("faculty_sections")
                    .select("college_subjects(subjectName)")
                    .eq("facultyId", currentFacultyId)
                    .is("deletedAt", null);
                
                if (subjectData && subjectData.length > 0) {
                    const subjects = subjectData
                        .map((s: any) => s.college_subjects?.subjectName)
                        .filter(Boolean)
                        .join(", ");
                    setFacultySubject(`(${subjects})`);
                }

                
                const [classesData, statsData] = await Promise.all([
                    getUpcomingClasses(userId),
                    getFacultyDashboardStats(currentFacultyId),
                ]);

                setUpcomingClasses(classesData);
                setStats(statsData);
            }
        } catch (error) {
            console.error("Failed to load dashboard dynamic data", error);
        } finally {
            setIsLoadingClasses(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleLessonPress = (lesson: UpcomingLesson) => {
        setSelectedLesson(lesson);
        setIsModalOpen(true);
    };

    const handleAcceptClass = async (classId: string) => {
        if (!facultyId) return;
        try {
            await handleMissionClassStatus(classId, facultyId, "Accepted");
            setIsModalOpen(false);
            navigation.navigate("Attendance", { classId: classId });
            Toast.show({ type: 'success', text1: "Class accepted" });
            loadData();
        } catch (error) {
            Toast.show({ type: 'error', text1: "Failed to accept class" });
        }
    };

    const handleCancelClass = async (classId: string, reason: string) => {
        if (!facultyId) return;
        try {
            await handleMissionClassStatus(classId, facultyId, "Cancel", reason);
            setIsModalOpen(false);
            Toast.show({ type: 'success', text1: "Class cancelled" });
            loadData();
        } catch (error) {
            Toast.show({ type: 'error', text1: "Failed to cancel class" });
        }
    };

    const pad = (num: number) => num.toString().padStart(2, "0");

    const cardData = [
        {
            style: "bg-[#E2DAFF]",
            icon: <Chalkboard size={32} weight="fill" color="#714EF2" />,
            value: `${pad(stats.acceptedClasses)}/${pad(stats.totalClasses)}`,
            label: "Total Classes",
        },
        {
            style: "bg-[#FFEDDA]",
            icon: <UsersThree size={32} weight="fill" color="#FFBB70" />,
            value: `${pad(stats.presentStudents)}/${pad(stats.totalStudents)}`,
            label: "Total Students",
        },
        {
            style: "bg-[#E6FBEA]",
            icon: <BookOpen size={32} weight="fill" color="#74FF8F" />,
            value: `${pad(stats.completedLessons)}/${pad(stats.totalLessons)}`,
            label: "Total Lessons",
        },
        {
            style: "bg-[#CEE6FF]",
            icon: <ClockAfternoon size={32} weight="fill" color="#60AEFF" />,
            value: `${pad(stats.acceptedHours)}/${pad(stats.totalHours)}`,
            label: "Total Hours",
        },
    ];

    const card = [
        {
            show: false,
            user: user?.fullName ?? "User",
            studentsTaskPercentage: 0,
            facultySubject: facultySubject || "(Faculty)",
            image: gender === "Female" 
                ? require("../../../../../assets/female-faculty.png") 
                : require("../../../../../assets/male-faculty.png"),
        },
    ];

    return (
        <ScrollView 
            className="w-full flex-1"
            contentContainerStyle={{ paddingTop: headerHeight + 16, paddingHorizontal: 16, paddingBottom: 160 }}
        >
            <UserInfoCard cardProps={card} />
            
            {isLoadingClasses ? (
                <View className="py-10 items-center justify-center">
                    <ActivityIndicator size="large" color="#089144" />
                </View>
            ) : (
                <>
                    <View className="mt-4 flex-row flex-wrap justify-between">
                        {cardData.map((item, index) => (
                            <View key={index} className="w-[48%] mb-4">
                                <CardComponent
                                    style={item.style}
                                    icon={item.icon}
                                    value={item.value}
                                    label={item.label}
                                />
                            </View>
                        ))}
                    </View>

                    <View className="mt-4">
                        <StudentPerformanceCard students={STUDENT_DATA} />
                    </View>

                    <View className="mt-4">
                        <UpcomingClasses
                            lessons={upcomingClasses}
                            onAddLesson={() => navigation.navigate("Calendar")}
                            onLessonPress={handleLessonPress}
                            facultyId={Number(facultyId)}
                            loading={isLoadingClasses}
                        />
                    </View>
                </>
            )}

            <ClassActionModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                lesson={selectedLesson} 
                onAccept={handleAcceptClass} 
                onCancelClass={handleCancelClass} 
            />
        </ScrollView>
    );
}

import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View } from 'react-native';
import { useUser } from "./context/UserContext";
import { useFaculty } from "./context/faculty/useFaculty";
import { extractAcademicYearNumber } from "./academicYear";

type Props = {
    style?: string;
    isVisibile?: boolean;
    department?: string;
    degree?: string;
    year?: string;
    fullWidth?: boolean;
};

export default function CourseScheduleCard({
    style = "",
    isVisibile = true,
    fullWidth = false,
}: Props) {
    const [time, setTime] = useState("");
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");

    const {
        collegeEducationType,
        collegeBranchCode,
        collegeAcademicYear,
        role,
        loading,
    } = useUser();
    const academicYearNumber = extractAcademicYearNumber(collegeAcademicYear);
    const { college_branch } = useFaculty();

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, "0");
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;

            setTime(`${String(hours).padStart(2, "0")}:${minutes} ${ampm}`);
            setDay(String(now.getDate()).padStart(2, "0"));
            setMonth(now.toLocaleString("en-US", { month: "short" }));
        };

        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <View
            className={`flex-row ${isVisibile ? "justify-between" : "justify-end"
                } ${style} ${fullWidth ? "w-full" : ""}`}
        >
            {isVisibile && (
                <View className="bg-[#43C17A] w-[49%] h-[54px] shadow-sm rounded-lg p-3 flex-row items-center justify-center">
                    {loading ? (
                        <View className="flex w-full flex-col items-center justify-center">
                            <View className="h-[14px] w-24 rounded bg-white/40 mb-1" />
                            <View className="h-[10px] w-14 rounded bg-white/30" />
                        </View>
                    ) : role === "Student" ? (
                        <Text className="text-[#EFEFEF] text-sm font-medium text-center">
                            {collegeEducationType && collegeBranchCode
                                ? `${collegeEducationType} ${collegeBranchCode}`
                                : "—"}{" "}
                            – {academicYearNumber ? `${academicYearNumber}` : "—"}
                        </Text>
                    ) : role === "Faculty" ? (
                        <Text className="text-[#EFEFEF] text-base font-medium text-center">
                            {college_branch ? `${college_branch}` : "—"}
                        </Text>
                    ) : role === "Finance" || role === "FinanceManager" ? (
                        <Text className="text-[#EFEFEF] text-base font-medium text-center">
                            {collegeEducationType ? `${collegeEducationType}` : "—"}
                        </Text>
                    ) : (
                        <View className="h-[14px] w-20 rounded bg-white/30" />
                    )}
                </View>
            )}

            <View
                className={`bg-white shadow-sm h-[54px] rounded-lg flex-row items-center ${fullWidth ? "w-full" : "w-[49%]"
                    }`}
            >
                <View className="w-[30%] h-full flex flex-col justify-center items-center rounded-l-lg bg-[#16284F]">
                    {day && month ? (
                        <>
                            <Text className="text-xs text-[#EFEFEF] font-medium">{day}</Text>
                            <Text className="text-xs text-[#FFFFFF]">{month}</Text>
                        </>
                    ) : (
                        <View className="flex flex-col items-center justify-center">
                            <View className="h-3 w-5 rounded bg-white/40 mb-1" />
                            <View className="h-[10px] w-7 rounded bg-white/30" />
                        </View>
                    )}
                </View>

                <View className="w-[70%] rounded-r-lg flex-row items-center justify-center">
                    {time ? (
                        <Text className="text-[#16284F] text-base font-semibold">{time}</Text>
                    ) : (
                        <View className="h-4 w-20 rounded bg-gray-200" />
                    )}
                </View>
            </View>
        </View>
    );
}
import React, { useState, useMemo, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import {
    CheckCircle,
    WarningCircle,
    Clock,
    CaretDown,
    Receipt,
    CheckSquare,
    Square
} from "phosphor-react-native";
import { MotiView, AnimatePresence } from "moti";
import { ExtendedFeePlan, SemesterRoadmapItem, FeeSummaryItem } from "./types";
import { formatCurrency } from "./utils";
import { generateSemesterReceipt } from "@/utils/generateReceipt";

interface AcademicFeesProps {
    plan: ExtendedFeePlan;
    history: FeeSummaryItem[];
    profilePhoto: string | null;
    studentName: string;
    courseInfo: string;
    onPayPress: (amount: number, semesterIds: number[]) => void;
}

export default function AcademicFees({
    plan,
    history,
    profilePhoto,
    studentName,
    courseInfo,
    onPayPress,
}: AcademicFeesProps) {
    const { t } = useTranslation();

    // Accordion State
    const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
    const [isSelectorExpanded, setIsSelectorExpanded] = useState(true);

    // Selected Semesters State
    const [selectedSemesterIds, setSelectedSemesterIds] = useState<Set<number>>(new Set());

    const unpaidSemesters = useMemo(() => {
        if (!plan?.semesterRoadmap) return [];
        return plan.semesterRoadmap.filter(sem => sem.status !== "PAID");
    }, [plan?.semesterRoadmap]);

    useEffect(() => {
        if (unpaidSemesters.length > 0) {
            const currentSem = unpaidSemesters.find(sem => sem.isCurrent);
            if (currentSem && currentSem.status !== "PAID") {
                setSelectedSemesterIds(new Set([currentSem.semesterId]));
            } else if (unpaidSemesters.length === 1) {
                setSelectedSemesterIds(new Set([unpaidSemesters[0].semesterId]));
            }
        }
    }, [unpaidSemesters]);

    const toggleSemesterSelection = (semesterId: number) => {
        setSelectedSemesterIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(semesterId)) {
                newSet.delete(semesterId);
            } else {
                newSet.add(semesterId);
            }
            return newSet;
        });
    };

    const groupedRoadmap = useMemo(() => {
        if (!plan?.semesterRoadmap) return {};

        return plan.semesterRoadmap.reduce((acc: any, sem: any) => {
            const year = sem.academicYearName || "Other";
            if (!acc[year]) acc[year] = [];
            acc[year].push(sem);
            return acc;
        }, {});
    }, [plan?.semesterRoadmap]);

    useEffect(() => {
        if (!groupedRoadmap) return;
        const initialExpanded: Record<string, boolean> = {};
        
        // Default state: all accordions closed. 
        // We only initialize the keys to false.
        Object.keys(groupedRoadmap).forEach(yearName => {
            initialExpanded[yearName] = false;
        });

        setExpandedYears(initialExpanded);
    }, [groupedRoadmap]);

    const toggleYear = (year: string) => {
        setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
    };

    const totalSelectedAmount = useMemo(() => {
        let sum = 0;
        unpaidSemesters.forEach(sem => {
            if (selectedSemesterIds.has(sem.semesterId)) {
                sum += sem.pendingAmount;
            }
        });
        return sum;
    }, [selectedSemesterIds, unpaidSemesters]);

    if (!plan) {
        return (
            <View className="p-6 items-center">
                <Text className="text-gray-500 font-medium">{t("Payments.student.Loading fee details")}</Text>
            </View>
        );
    }

    const isProgramFullyPaid = plan.pendingAmount <= 0;

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return (
                    <View className="flex-row items-center gap-1 bg-emerald-100 px-2 py-1 rounded shadow-sm">
                        <CheckCircle weight="fill" size={12} color="#059669" />
                        <Text className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider">{t("Payments.student.Paid")}</Text>
                    </View>
                );
            case "PARTIAL":
                return (
                    <View className="flex-row items-center gap-1 bg-amber-100 px-2 py-1 rounded shadow-sm">
                        <Clock weight="fill" size={12} color="#D97706" />
                        <Text className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">{t("Payments.student.Partial")}</Text>
                    </View>
                );
            default:
                return (
                    <View className="flex-row items-center gap-1 bg-rose-100 px-2 py-1 rounded shadow-sm">
                        <WarningCircle weight="fill" size={12} color="#E11D48" />
                        <Text className="text-rose-700 text-[10px] font-bold uppercase tracking-wider">{t("Payments.student.Unpaid")}</Text>
                    </View>
                );
        }
    };

    return (
        <View className="space-y-6">
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative">
                <Text className="text-lg font-semibold text-gray-800 mb-4">
                    {t("Payments.student.Active Fee Plan")}
                </Text>

                <View className="bg-emerald-50 rounded-lg p-4 mb-6 flex-row justify-between items-center border border-emerald-100/50">
                    <View className="flex-1 pr-3">
                        <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
                            {plan.programName}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                            {t(`Payments.student.${plan.type || "Academic Fees"}`)}
                        </Text>
                    </View>
                    <View className="bg-white px-2 py-1 rounded border border-emerald-100 shadow-sm">
                        <Text className="text-gray-500 font-bold text-xs">
                            {plan.academicYear}
                        </Text>
                    </View>
                </View>

                <View className="w-full py-2 px-2 mb-8 gap-y-3">
                    <View className="pb-2 border-b border-dashed border-gray-200">
                        <Text className="text-gray-700 font-bold text-sm">
                            {t("Payments.student.Standard Semester Cost Breakdown")}
                        </Text>
                    </View>

                    {plan.components?.length > 0 ? (
                        plan.components.map((comp: any, idx: number) => (
                            <View key={idx} className="flex-row justify-between items-center">
                                <Text className="text-gray-600 text-sm">{comp.label}</Text>
                                <Text className="text-gray-600 font-medium text-sm">
                                    {formatCurrency(comp.amount)}
                                </Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-gray-400 italic text-xs py-1">
                            {t("Payments.student.No fee details found")}
                        </Text>
                    )}

                    {plan.gstAmount > 0 && (
                        <View className="flex-row justify-between items-center">
                            <Text className="text-gray-600 text-sm">
                                {t("Payments.student.GST")} {plan.gstPercent > 0 ? `(${plan.gstPercent}%)` : ""}
                            </Text>
                            <Text className="text-gray-600 font-medium text-sm">
                                {formatCurrency(plan.gstAmount)}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row justify-between items-center border-t border-dashed border-gray-200 pt-3 mt-1">
                        <Text className="text-gray-800 font-bold text-sm">
                            {t("Payments.student.Base Semester Fee")}
                        </Text>
                        <Text className="text-emerald-500 font-bold text-base">
                            {formatCurrency(plan.semesterTotalPayable || 0)}
                        </Text>
                    </View>
                </View>

                {plan.semesterRoadmap && plan.semesterRoadmap.length > 0 && (
                    <View className="mt-8 mb-8">
                        <Text className="font-bold text-gray-800 mb-8 text-base text-center">
                            {t("Payments.student.Program Progress Tracker")}
                        </Text>

                        <View className="relative w-full">
                            {/* Vertical Line Container */}
                            <View className="absolute left-0 w-10 items-center z-0" style={{ top: 16, bottom: 16 }}>
                                <View style={{ width: 2, height: '100%', backgroundColor: '#E2E8F0' }} />
                            </View>

                            <View className="gap-y-6">
                                {Object.entries(groupedRoadmap).map(
                                    ([yearName, semesters]: [string, any], index) => {
                                        const isExpanded = expandedYears[yearName] || false;

                                        return (
                                            <View key={yearName} className="relative flex-row items-start w-full">
                                                {/* Year Circle */}
                                                <View className="absolute left-0 top-3.5 items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 shadow-sm z-10">
                                                    <Text className="text-xs font-bold text-slate-600">
                                                        {yearName.split(" ")[0]}
                                                    </Text>
                                                </View>

                                                {/* Content Box */}
                                                <View className="ml-16 flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm">
                                                    <TouchableOpacity
                                                        className="flex-row justify-between items-center"
                                                        activeOpacity={0.7}
                                                        onPress={() => toggleYear(yearName)}
                                                    >
                                                        <Text className="font-bold text-gray-800 text-base">
                                                            {yearName}
                                                        </Text>
                                                        <View className="flex-row items-center gap-2">
                                                            <View className="bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm">
                                                                <Text className="text-xs text-gray-500 font-semibold">
                                                                    {semesters.length} {t("Payments.student.Semesters")}
                                                                </Text>
                                                            </View>
                                                            <MotiView
                                                                animate={{ rotate: isExpanded ? "180deg" : "0deg" }}
                                                                transition={{ type: "timing", duration: 300 }}
                                                                className="w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm border border-gray-200"
                                                            >
                                                                <CaretDown size={14} weight="bold" color="#6B7280" />
                                                            </MotiView>
                                                        </View>
                                                    </TouchableOpacity>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <MotiView
                                                                from={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ type: "timing", duration: 300 }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <View className="gap-y-3 pt-4 pb-2">
                                                                    {semesters.map((sem: any) => {
                                                                        return (
                                                                        <View
                                                                            key={sem.semesterId}
                                                                            className={`relative p-3.5 pb-5 rounded-xl bg-white ${sem.isCurrent
                                                                                    ? "border-2 border-blue-500 shadow-sm z-10"
                                                                                    : "border border-gray-200"
                                                                                }`}
                                                                        >
                                                                            <View className="flex-row justify-between items-start mb-3">
                                                                                <View className="flex-1 pr-1">
                                                                                    <Text
                                                                                        className={`font-bold text-sm ${sem.isCurrent ? "text-blue-700" : "text-gray-800"}`}
                                                                                    >
                                                                                        {t("Payments.student.Semester")} {sem.semesterNumber}
                                                                                    </Text>
                                                                                    {sem.isCurrent && (
                                                                                        <Text className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-0.5">
                                                                                            {t("Payments.student.Current")}
                                                                                        </Text>
                                                                                    )}
                                                                                </View>
                                                                                <View className="pl-1">
                                                                                    {renderStatusBadge(sem.status)}
                                                                                </View>
                                                                            </View>

                                                                            <View className="relative mt-2">
                                                                                {sem.status === "PAID" ? (
                                                                                    <View className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                                                        <Text className="text-xs text-gray-500">
                                                                                            {t("Payments.student.Paid:")}
                                                                                        </Text>
                                                                                        <Text className="font-bold text-emerald-600 text-sm mt-0.5">
                                                                                            {formatCurrency(sem.paidAmount)}
                                                                                        </Text>
                                                                                    </View>
                                                                                ) : (
                                                                                    <View className="bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                                                                                        <Text className="text-xs text-gray-500">
                                                                                            {t("Payments.student.Due:")}
                                                                                        </Text>
                                                                                        <Text className="font-bold text-red-600 text-sm mt-0.5">
                                                                                            {formatCurrency(sem.pendingAmount)}
                                                                                        </Text>
                                                                                        {sem.paidAmount > 0 && (
                                                                                            <View className="flex-row items-center mt-1.5 gap-1">
                                                                                                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                                <Text className="text-xs text-gray-500 font-medium">
                                                                                                    {t("Payments.student.Paid:")} <Text className="font-semibold text-gray-700">{formatCurrency(sem.paidAmount)}</Text>
                                                                                                </Text>
                                                                                            </View>
                                                                                        )}
                                                                                    </View>
                                                                                )}
                                                                                {sem.paidAmount > 0 && (
                                                                                    <View className="absolute bottom-1 right-2">
                                                                                        <TouchableOpacity
                                                                                            onPress={() => {
                                                                                                generateSemesterReceipt(
                                                                                                    plan,
                                                                                                    sem,
                                                                                                    { name: studentName, rollNo: courseInfo?.split('|')[0]?.trim() || "N/A" },
                                                                                                    history
                                                                                                );
                                                                                            }}
                                                                                            className="p-1.5"
                                                                                        >
                                                                                            <Receipt size={24} color="#9CA3AF" weight="duotone" />
                                                                                        </TouchableOpacity>
                                                                                    </View>
                                                                                )}
                                                                            </View>
                                                                        </View>
                                                                    )})}
                                                                </View>
                                                            </MotiView>
                                                        )}
                                                    </AnimatePresence>
                                                </View>
                                            </View>
                                        );
                                    },
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {!isProgramFullyPaid && unpaidSemesters.length > 0 ? (
                    <View className="bg-white rounded-2xl border border-gray-200 mt-6 shadow-sm overflow-hidden">
                        <TouchableOpacity 
                            onPress={() => setIsSelectorExpanded(!isSelectorExpanded)}
                            activeOpacity={0.7}
                            className="bg-slate-50 px-4 py-3 border-b border-gray-100 flex-row justify-between items-center"
                        >
                            <Text className="font-bold text-gray-800 text-sm">
                                📋 {t("Payments.student.Select Semesters to Pay")}
                            </Text>
                            <MotiView
                                animate={{ rotate: isSelectorExpanded ? "180deg" : "0deg" }}
                                transition={{ type: "timing", duration: 300 }}
                            >
                                <CaretDown size={16} weight="bold" color="#6B7280" />
                            </MotiView>
                        </TouchableOpacity>
                        
                        <AnimatePresence>
                            {isSelectorExpanded && (
                                <MotiView
                                    from={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ type: "timing", duration: 300 }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <View className="px-4 py-2">
                                        {unpaidSemesters.map(sem => {
                                            const isSelected = selectedSemesterIds.has(sem.semesterId);
                                            return (
                                                <TouchableOpacity
                                                    key={sem.semesterId}
                                                    onPress={() => toggleSemesterSelection(sem.semesterId)}
                                                    activeOpacity={0.7}
                                                    className={`flex-row items-center justify-between py-3 border-b border-gray-50 ${sem.isCurrent ? 'border-l-4 border-l-blue-500 pl-3 -ml-4' : ''}`}
                                                >
                                                    <View className="flex-row items-center gap-3">
                                                        {isSelected ? (
                                                            <CheckSquare size={20} weight="fill" color="#10B981" />
                                                        ) : (
                                                            <Square size={20} weight="bold" color="#D1D5DB" />
                                                        )}
                                                        <View>
                                                            <Text className="font-medium text-gray-800 text-sm">
                                                                {sem.localSemesterName || `${t("Payments.student.Semester")} ${sem.semesterNumber}`}
                                                            </Text>
                                                            {sem.isCurrent && (
                                                                <Text className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">
                                                                    {t("Payments.student.Current")}
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                    <Text className="font-bold text-gray-700">
                                                        {formatCurrency(sem.pendingAmount)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                        <View className="flex-row justify-between items-center py-4 mt-2 border-t border-gray-100 border-dashed">
                                            <Text className="font-bold text-gray-600">
                                                {t("Payments.student.Total Selected:")}
                                            </Text>
                                            <Text className="font-black text-xl text-emerald-600">
                                                {formatCurrency(totalSelectedAmount)}
                                            </Text>
                                        </View>
                                    </View>
                                </MotiView>
                            )}
                        </AnimatePresence>
                    </View>
                ) : (
                    <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 mt-6 shadow-sm items-center">
                        <View className="mb-2">
                            <CheckCircle size={32} color="#10B981" weight="fill" />
                        </View>
                        <Text className="text-emerald-800 font-bold text-lg text-center">
                            {t("Payments.student.Fully Paid")}
                        </Text>
                        <Text className="text-emerald-600 text-xs mt-1 text-center">
                            {t("Payments.student.No pending dues for this program")}
                        </Text>
                    </View>
                )}

                <View className="mt-6">
                    <TouchableOpacity
                        onPress={() => onPayPress(totalSelectedAmount, Array.from(selectedSemesterIds))}
                        disabled={isProgramFullyPaid || selectedSemesterIds.size === 0}
                        className={`py-3.5 rounded-xl flex-row items-center justify-center shadow-sm w-full
                            ${!isProgramFullyPaid && selectedSemesterIds.size > 0
                                ? "bg-emerald-500"
                                : "bg-gray-200"
                            }
                        `}
                    >
                        <Text className={`font-bold ${!isProgramFullyPaid && selectedSemesterIds.size > 0 ? "text-white" : "text-gray-400"}`}>
                            {!isProgramFullyPaid && selectedSemesterIds.size > 0
                                ? `${t("Payments.student.Pay")} ${formatCurrency(totalSelectedAmount)}`
                                : isProgramFullyPaid
                                    ? t("Payments.student.Fully Paid")
                                    : t("Payments.student.Select semesters to pay")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

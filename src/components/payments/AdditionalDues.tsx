import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import { WarningCircle, CheckCircle } from "phosphor-react-native";
import { MotiView } from "moti";
import { FinancialDue, NonFinancialDue, ExcessDue } from "./types";
import { formatCurrency } from "./utils";

interface AdditionalDuesProps {
    financialDues: FinancialDue[];
    nonFinancialDues: NonFinancialDue[];
    excessDues: ExcessDue[];
    onPayPress: (amount: number, dueId: string | number) => void;
}

export default function AdditionalDues({
    financialDues,
    nonFinancialDues,
    excessDues,
    onPayPress,
}: AdditionalDuesProps) {
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = useState<
        "FINANCIAL" | "NON_FINANCIAL" | "EXCESS"
    >("FINANCIAL");

    const tabs = [
        { id: "FINANCIAL", label: t("Payments.student.Financial") },
        { id: "NON_FINANCIAL", label: t("Payments.student.Non-Financial") },
        { id: "EXCESS", label: t("Payments.student.Excess") },
    ] as const;

    const renderFinancialDue = (due: FinancialDue) => (
        <View key={due.id} className="bg-white rounded-xl p-4 border border-gray-200 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-sm text-emerald-600 font-medium mb-1">{due.department}</Text>
                    <Text className="text-gray-900 font-semibold">{due.category}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full border ${due.status === "Paid" ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
                    <Text className={`text-xs font-medium ${due.status === "Paid" ? "text-emerald-700" : "text-red-700"}`}>
                        {due.status}
                    </Text>
                </View>
            </View>

            <View className="bg-gray-50 rounded-lg p-3 space-y-2 mb-4">
                <View className="flex-row justify-between">
                    <Text className="text-sm text-gray-500">{t("Payments.student.Base Amount")}</Text>
                    <Text className="text-sm text-gray-900">{formatCurrency(due.amount)}</Text>
                </View>
                {due.penaltyAmount > 0 && (
                    <View className="flex-row justify-between">
                        <Text className="text-sm text-red-500">{t("Payments.student.Penalty")}</Text>
                        <Text className="text-sm text-red-600">{formatCurrency(due.penaltyAmount)}</Text>
                    </View>
                )}
                {due.waiverAmount > 0 && (
                    <View className="flex-row justify-between">
                        <Text className="text-sm text-emerald-500">{t("Payments.student.Waiver")}</Text>
                        <Text className="text-sm text-emerald-600">-{formatCurrency(due.waiverAmount)}</Text>
                    </View>
                )}
                <View className="flex-row justify-between pt-2 border-t border-gray-200">
                    <Text className="text-sm font-medium text-gray-900">{t("Payments.student.Total Payable")}</Text>
                    <Text className="text-sm font-bold text-gray-900">{formatCurrency(due.totalPayable)}</Text>
                </View>
            </View>

            {due.status !== "Paid" && due.pendingAmount > 0 && (
                <View className="flex-row justify-between items-center mt-2">
                    <View>
                        <Text className="text-xs text-gray-500 mb-0.5">{t("Payments.student.Pending Amount")}</Text>
                        <Text className="font-bold text-red-600">{formatCurrency(due.pendingAmount)}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => onPayPress(due.pendingAmount, due.id)}
                        className="bg-[#14b8a6] px-6 py-2.5 rounded-lg"
                    >
                        <Text className="text-white font-medium text-sm">{t("Payments.student.Pay Now")}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderNonFinancialDue = (due: NonFinancialDue) => (
        <View key={due.id} className="bg-white rounded-xl p-4 border border-gray-200 mb-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 pr-4">
                    <Text className="text-sm text-purple-600 font-medium mb-1">{due.department}</Text>
                    <Text className="text-gray-900 font-semibold">{due.category}</Text>
                </View>
                <View className="items-center">
                    {due.status === "Cleared" ? (
                        <CheckCircle size={24} color="#059669" weight="fill" />
                    ) : (
                        <WarningCircle size={24} color="#DC2626" weight="fill" />
                    )}
                </View>
            </View>
            
            <View className="flex-row items-center justify-between mt-2 pt-3 border-t border-gray-100">
                <View>
                    <Text className="text-xs text-gray-500">{t("Payments.student.Due Date")}</Text>
                    <Text className="text-sm font-medium text-gray-900">{due.dueDate}</Text>
                </View>
                <View>
                    <Text className="text-xs text-gray-500">{t("Payments.student.Status")}</Text>
                    <Text className={`text-sm font-medium ${due.status === "Cleared" ? "text-emerald-600" : "text-red-600"}`}>
                        {due.status}
                    </Text>
                </View>
            </View>
            {due.remarks && (
                <Text className="text-sm text-gray-500 mt-3 italic">{due.remarks}</Text>
            )}
        </View>
    );

    const renderExcessDue = (due: ExcessDue) => (
        <View key={due.id} className="bg-white rounded-xl p-4 border border-emerald-200 mb-4 bg-emerald-50/10" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <View className="flex-row justify-between items-center">
                <View>
                    <Text className="text-sm text-emerald-600 font-medium mb-1">{due.department}</Text>
                    <Text className="text-gray-900 font-semibold">{due.category}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-gray-500 mb-1">{t("Payments.student.Excess Amount")}</Text>
                    <Text className="text-lg font-bold text-emerald-600">{formatCurrency(due.amount)}</Text>
                </View>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View className="bg-white rounded-xl p-8 items-center justify-center border border-gray-100 border-dashed mt-4">
            <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-4">
                <CheckCircle size={32} color="#9CA3AF" weight="light" />
            </View>
            <Text className="text-lg font-medium text-gray-900 mb-2">
                {t("Payments.student.No Dues Found")}
            </Text>
            <Text className="text-center text-gray-500">
                {t("Payments.student.No Data Available")}
            </Text>
        </View>
    );

    return (
        <View className="flex-1">
            {/* Sub-tabs */}
            <View className="mb-6 px-4">
                <View className="flex-row bg-gray-100/80 rounded-full p-1 relative w-full">
                    <MotiView
                        className="absolute rounded-full bottom-1 top-1"
                        style={{ 
                            width: `${100 / tabs.length}%`,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            borderWidth: 1,
                            borderColor: 'rgba(16, 185, 129, 0.3)'
                        }}
                        animate={{
                            left: `${(tabs.findIndex(t => t.id === activeSubTab) * 100) / tabs.length}%`
                        }}
                        transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    />
                    {tabs.map((tab) => {
                        const isActive = activeSubTab === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveSubTab(tab.id)}
                                className="flex-1 py-2 rounded-full items-center justify-center z-10"
                            >
                                <Text 
                                    className={`font-medium text-xs md:text-sm ${isActive ? "text-emerald-800 font-bold" : "text-gray-500"}`}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Content List */}
            <View>
                {activeSubTab === "FINANCIAL" && (
                    financialDues.length > 0
                        ? financialDues.map(renderFinancialDue)
                        : renderEmptyState()
                )}

                {activeSubTab === "NON_FINANCIAL" && (
                    nonFinancialDues.length > 0
                        ? nonFinancialDues.map(renderNonFinancialDue)
                        : renderEmptyState()
                )}

                {activeSubTab === "EXCESS" && (
                    excessDues.length > 0
                        ? excessDues.map(renderExcessDue)
                        : renderEmptyState()
                )}
            </View>
        </View>
    );
}

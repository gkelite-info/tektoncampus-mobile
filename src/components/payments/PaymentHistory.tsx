import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "@/components/AppText";
import { useTranslation } from "react-i18next";
import {
    CheckCircle,
    WarningCircle,
    Clock,
    DownloadSimple,
    Receipt
} from "phosphor-react-native";
import { FeeSummaryItem } from "./types";
import { formatCurrency } from "./utils";

interface PaymentHistoryProps {
    history: FeeSummaryItem[];
    onDownloadReceipt?: (item: FeeSummaryItem) => void;
}

export default function PaymentHistory({ history, onDownloadReceipt }: PaymentHistoryProps) {
    const { t } = useTranslation();

    const totalSpent = useMemo(() => {
        return history
            .filter((h) => h.status === "succeeded" || h.status === "success" || h.status === "PAID")
            .reduce((sum, item) => sum + item.paidAmount, 0);
    }, [history]);

    const getStatusIcon = (status: FeeSummaryItem["status"]) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === "succeeded" || lowerStatus === "success" || lowerStatus === "paid") {
            return <CheckCircle size={20} color="#059669" weight="fill" />;
        }
        if (lowerStatus === "failed" || lowerStatus === "failure") {
            return <WarningCircle size={20} color="#DC2626" weight="fill" />;
        }
        return <Clock size={20} color="#D97706" weight="fill" />;
    };

    const getStatusStyle = (status: FeeSummaryItem["status"]) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === "succeeded" || lowerStatus === "success" || lowerStatus === "paid") {
            return "bg-emerald-50 text-emerald-700 border-emerald-100";
        }
        if (lowerStatus === "failed" || lowerStatus === "failure") {
            return "bg-red-50 text-red-700 border-red-100";
        }
        return "bg-amber-50 text-amber-700 border-amber-100";
    };

    const getStatusText = (status: FeeSummaryItem["status"]) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === "succeeded" || lowerStatus === "success" || lowerStatus === "paid") {
            return t("Payments.student.Success");
        }
        if (lowerStatus === "failed" || lowerStatus === "failure") {
            return t("Payments.student.Failure");
        }
        return t("Payments.student.Pending");
    };

    return (
        <View className="flex-1">
            {/* Summary Card */}
            <View className="bg-teal-500 rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
                <Text className="text-teal-50 text-sm font-medium mb-1">
                    {t("Payments.student.Total Amount Spent")}
                </Text>
                <Text className="text-white text-3xl font-bold">
                    {formatCurrency(totalSpent)}
                </Text>
                <View className="absolute -right-4 -bottom-4 opacity-20">
                    <Receipt size={100} color="white" weight="duotone" />
                </View>
            </View>

            {/* Title */}
            <Text className="text-lg font-semibold text-gray-900 mb-4">
                {t("Payments.student.Recent Transactions")}
            </Text>

            {/* Transaction List */}
            {history.length > 0 ? (
                <View className="space-y-4 gap-y-4">
                    {history.map((item) => {
                        const isSuccess = item.status.toLowerCase() === "succeeded" || item.status.toLowerCase() === "success";

                        return (
                            <View key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View>
                                        <Text className="text-lg font-bold text-gray-900">
                                            {formatCurrency(item.paidAmount)}
                                        </Text>
                                        <Text className="text-sm text-gray-500 mt-1">
                                            {item.paidOn}
                                        </Text>
                                    </View>
                                    <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full border ${getStatusStyle(item.status)}`}>
                                        {getStatusIcon(item.status)}
                                        <Text className={`text-xs font-medium ${getStatusStyle(item.status).split(" ")[1]}`}>
                                            {getStatusText(item.status)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="bg-gray-50 rounded-lg p-3 space-y-2 mb-4 gap-y-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-sm text-gray-500">{t("Payments.student.Payment Mode")}</Text>
                                        <Text className="text-sm font-medium text-gray-900">{item.paymentMode}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-sm text-gray-500">{t("Payments.student.Transaction ID")}</Text>
                                        <Text className="text-sm font-medium text-gray-900" numberOfLines={1} ellipsizeMode="middle" style={{ maxWidth: 150 }}>
                                            {item.gatewayTransactionId || `TRX-${item.id}`}
                                        </Text>
                                    </View>
                                    {item.comments && (
                                        <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
                                            <Text className="text-sm text-gray-500">{t("Payments.student.Note")}</Text>
                                            <Text className="text-sm text-gray-700 italic">{item.comments}</Text>
                                        </View>
                                    )}
                                </View>

                                {isSuccess && onDownloadReceipt && (
                                    <TouchableOpacity
                                        onPress={() => onDownloadReceipt(item)}
                                        className="flex-row justify-center items-center gap-2 py-2.5 rounded-lg border border-gray-200 bg-white"
                                    >
                                        <DownloadSimple size={18} color="#4B5563" />
                                        <Text className="text-sm font-medium text-gray-700">
                                            {t("Payments.student.Download Receipt")}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>
            ) : (
                <View className="bg-white rounded-xl p-8 items-center justify-center border border-gray-100 border-dashed mt-4">
                    <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-4">
                        <Receipt size={32} color="#9CA3AF" weight="light" />
                    </View>
                    <Text className="text-lg font-medium text-gray-900 mb-2">
                        {t("Payments.student.No Transactions")}
                    </Text>
                    <Text className="text-center text-gray-500">
                        {t("Payments.student.You haven't made any payments yet.")}
                    </Text>
                </View>
            )}
        </View>
    );
}

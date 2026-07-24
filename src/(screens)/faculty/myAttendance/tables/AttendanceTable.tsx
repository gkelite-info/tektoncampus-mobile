import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { CaretDown, CaretLeft, CaretRight } from "phosphor-react-native";
import { AttendanceRecord } from "../types";
import { fonts } from "@/constants/fonts";

interface Props {
  title?: string;
  records: AttendanceRecord[];
  month: string;
  year: string;
  totalItems?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onMonthYearChange?: (month: number, year: number) => void;
}

const months = [
"JAN", "FEB", "MAR", "APR", "MAY", "JUN",
"JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];


export const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-[#22C55E]",
  ABSENT: "bg-[#EF4444]",
  LEAVE: "bg-[#60AEFF]",
  LATE: "bg-[#FFBE61]"
};

const AttendanceTable: React.FC<Props> = ({
  title,
  records,
  month,
  year,
  totalItems,
  currentPage,
  onPageChange,
  onMonthYearChange
}) => {const { t } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState(months.indexOf(month));
  const [selectedYear, setSelectedYear] = useState(Number(year));

  const itemsPerPage = 15;
  const safeTotalItems = Number(totalItems ?? 0);
  const safeCurrentPage = Number(currentPage ?? 1);
  const totalPages = Math.ceil(safeTotalItems / itemsPerPage);

  useEffect(() => {
    if (!onMonthYearChange) return;
    onMonthYearChange(selectedMonth + 1, selectedYear);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setSelectedMonth(months.indexOf(month));
    setSelectedYear(Number(year));
  }, [month, year]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <View className="w-full mt-4 flex-1">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[#282828] text-[17px]" style={{ fontFamily: fonts.bold }}>
          {title || t("Auto.Common.AttendanceTable", "Attendance Table")}
        </Text>

        <View className="flex-row items-center bg-[#43C17A] rounded-lg overflow-hidden">
          <TouchableOpacity onPress={handlePrevMonth} className="px-2 py-2 border-r border-[#3baf6d]">
            <CaretLeft size={14} color="white" weight="bold" />
          </TouchableOpacity>
          <View className="px-3 py-1.5 flex-row items-center">
            <Text className="text-white text-[12px] font-medium" style={{ fontFamily: fonts.medium }}>
              {t(`Auto.Common.${months[selectedMonth]}`, months[selectedMonth])} {selectedYear}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNextMonth} className="px-2 py-2 border-l border-[#3baf6d]">
            <CaretRight size={14} color="white" weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View className="flex-row bg-[#F2F2F2] px-2 py-2.5 border-b border-gray-200">
              <Text className="w-24 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Date", "Date")}</Text>
              <Text className="w-20 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.CheckIn", "Check-In")}</Text>
              <Text className="w-20 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.CheckOut", "Check-Out")}</Text>
              <Text className="w-24 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.TotalHours", "Total Hours")}</Text>
              <Text className="w-20 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Status", "Status")}</Text>
              <Text className="w-32 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Reason", "Reason")}</Text>
              <Text className="w-20 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.LateBy", "Late By")}</Text>
              <Text className="w-20 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.EarlyOut", "Early Out")}</Text>
              <Text className="w-24 text-[#282828] text-[12.5px] font-semibold" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.ClassesTaken", "Classes Taken")}</Text>
            </View>

            {records.length === 0 ?
            <View className="py-8 items-center justify-center">
                <Text className="text-gray-400 text-sm" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Noattendancerec", "No attendance records found")}</Text>
              </View> :

            records.map((row, idx) =>
            <View key={idx} className="flex-row items-center px-2 py-3 border-b border-gray-100">
                  <Text className="w-24 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.date}</Text>
                  <Text className="w-20 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.checkIn}</Text>
                  <Text className="w-20 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.checkOut}</Text>
                  <Text className="w-24 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.totalHours}</Text>
                  <View className="w-20 items-start">
                    <View className={`px-2 py-0.5 rounded ${STATUS_STYLES[row.status] || "bg-gray-100"}`}>
                      <Text className={`text-[11px] ${STATUS_STYLES[row.status] ? "text-white" : "text-gray-600"}`} style={{ fontFamily: fonts.medium }}>
                        {t(`Auto.Common.${row.status}`, row.status)}
                      </Text>
                    </View>
                  </View>
                  <Text className="w-32 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }} numberOfLines={1}>{row.reason ?? "—"}</Text>
                  <Text className="w-20 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.lateBy}</Text>
                  <Text className="w-20 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.earlyOut}</Text>
                  <Text className="w-24 text-gray-500 text-[12px]" style={{ fontFamily: fonts.regular }}>{row.classDetail}</Text>
                </View>
            )
            }
          </View>
        </ScrollView>

        {onPageChange && safeTotalItems > 0 && totalPages > 1 &&
        <View className="flex-row justify-between items-center p-3 border-t border-gray-100">
            <TouchableOpacity
            disabled={safeCurrentPage === 1}
            onPress={() => onPageChange(safeCurrentPage - 1)}
            className={`px-3 py-1.5 rounded-md ${safeCurrentPage === 1 ? "bg-gray-100" : "bg-gray-200"}`}>
            
              <Text className={`text-[12px] ${safeCurrentPage === 1 ? "text-gray-400" : "text-gray-700"}`} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Prev", "Prev")}</Text>
            </TouchableOpacity>
            <Text className="text-[12px] text-gray-500" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Page", "Page")} {safeCurrentPage} {t("Auto.Common.of", "of")} {totalPages}</Text>
            <TouchableOpacity
            disabled={safeCurrentPage === totalPages}
            onPress={() => onPageChange(safeCurrentPage + 1)}
            className={`px-3 py-1.5 rounded-md ${safeCurrentPage === totalPages ? "bg-gray-100" : "bg-gray-200"}`}>
            
              <Text className={`text-[12px] ${safeCurrentPage === totalPages ? "text-gray-400" : "text-gray-700"}`} style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Next", "Next")}</Text>
            </TouchableOpacity>
          </View>
        }
      </View>
    </View>);

};

export default AttendanceTable;
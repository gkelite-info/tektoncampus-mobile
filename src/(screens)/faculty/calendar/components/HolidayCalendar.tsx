import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/AppText';
import tw from 'twrnc';
import { CaretLeft, CaretRight, CaretDown, CalendarBlank } from 'phosphor-react-native';
import { CollegeHoliday } from "@/lib/helpers/Hr/holidays/holidayAPI";
import ViewHolidayModal from "../modal/ViewHolidayModal";

interface HolidayCalendarProps {
  holidays: CollegeHoliday[];
  year: number;
  setYear: (year: number) => void;
  onRefresh: () => void;
}

const HOLIDAY_STYLES: Record<string, { bg: string, border: string, text: string, boxBg: string, boxText: string }> = {
  festival: { bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700", boxBg: "bg-orange-100", boxText: "text-orange-800" },
  weekly_off: { bg: "bg-slate-50", border: "border-slate-100", text: "text-slate-600", boxBg: "bg-slate-100", boxText: "text-slate-700" },
  government: { bg: "bg-blue-50", border: "border-blue-100", text: "text-blue-700", boxBg: "bg-blue-100", boxText: "text-blue-800" },
  emergency: { bg: "bg-red-50", border: "border-red-100", text: "text-red-700", boxBg: "bg-red-100", boxText: "text-red-800" },
  custom: { bg: "bg-purple-50", border: "border-purple-100", text: "text-purple-700", boxBg: "bg-purple-100", boxText: "text-purple-800" }
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Tailwind classes for the month headers (simulating gradients with a solid color in React Native unless using Expo LinearGradient)
const MONTH_COLORS = [
  "bg-blue-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500",
  "bg-indigo-500", "bg-fuchsia-500", "bg-cyan-500", "bg-lime-500",
  "bg-violet-500", "bg-orange-500", "bg-teal-500", "bg-sky-500"
];

export default function HolidayCalendar({ holidays, year, setYear, onRefresh }: HolidayCalendarProps) {
  const { t } = useTranslation();
  const [activeCardId, setActiveCardId] = useState<number | null>(null);
  const [holidayToView, setHolidayToView] = useState<CollegeHoliday | null>(null);
  
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const maxAvailableYear = currentYear + 3;

  const holidaysByMonth = useMemo(() => {
    const grouped = new Map<number, CollegeHoliday[]>();
    for (let i = 0; i < 12; i++) {
      grouped.set(i, []);
    }

    holidays.forEach(holiday => {
      const date = new Date(holiday.holidayDate);
      if (date.getFullYear() === year) {
        const month = date.getMonth();
        grouped.get(month)?.push(holiday);
      }
    });

    return grouped;
  }, [holidays, year]);

  return (
    <ScrollView style={tw`flex-1 p-2`} showsVerticalScrollIndicator={false}>
      
      {/* Top Toolbar */}
      <View style={tw`flex-row items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-8 h-8 rounded-lg bg-emerald-100 items-center justify-center mr-3`}>
            <CalendarBlank size={16} color="#059669" weight="bold" />
          </View>
          <Text style={tw`text-base font-bold text-slate-800`}>{t('Calendar.faculty.academicHolidays', 'Academic Holidays')}</Text>
        </View>

        <View style={tw`flex-row items-center`}>
          <TouchableOpacity 
            onPress={() => year > startYear && setYear(year - 1)}
            style={tw`w-9 h-9 items-center justify-center rounded-full bg-slate-50 border border-slate-200 mr-2`}
          >
            <CaretLeft size={16} color={year > startYear ? "#475569" : "#cbd5e1"} weight="bold" />
          </TouchableOpacity>
          
          <View style={tw`px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-xl mr-2 items-center justify-center`}>
            <Text style={tw`text-sm font-bold text-slate-700`}>{year}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => year < maxAvailableYear && setYear(year + 1)}
            style={tw`w-9 h-9 items-center justify-center rounded-full bg-slate-50 border border-slate-200`}
          >
            <CaretRight size={16} color={year < maxAvailableYear ? "#475569" : "#cbd5e1"} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid */}
      <View style={tw`flex-row flex-wrap justify-between pb-10`}>
        {MONTHS.map((monthName, monthIndex) => {
          const monthHolidays = holidaysByMonth.get(monthIndex) || [];
          if (monthHolidays.length === 0) return null;

          return (
            <View key={monthName} style={tw`w-[100%] mb-4 bg-white rounded-2xl border border-slate-200 overflow-hidden`}>
              <View style={tw`h-10 w-full ${MONTH_COLORS[monthIndex]} px-4 justify-center`}>
                <Text style={tw`text-white font-bold text-sm tracking-wide`}>{monthName} {year}</Text>
              </View>
              
              <View style={tw`p-3 bg-slate-50/50 gap-2`}>
                {monthHolidays.map((holiday) => {
                  const style = HOLIDAY_STYLES[holiday.holidayType] || HOLIDAY_STYLES.custom;
                  const dateObj = new Date(holiday.holidayDate);
                  const dayNum = dateObj.getDate();
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const isActive = activeCardId === holiday.holidayId;

                  return (
                    <TouchableOpacity
                      key={holiday.holidayId}
                      activeOpacity={0.7}
                      onPress={() => setHolidayToView(holiday)}
                      style={tw`flex-row items-center gap-3 p-3 rounded-xl border ${style.border} ${style.bg} ${isActive ? 'opacity-70' : ''}`}
                    >
                      <View style={tw`w-[3.5rem] h-[3.5rem] rounded-lg items-center justify-center border border-white/50 ${style.boxBg}`}>
                        <Text style={tw`text-xs font-bold uppercase ${style.boxText}`}>{dayName}</Text>
                        <Text style={tw`text-xl font-black ${style.boxText}`}>{dayNum}</Text>
                      </View>
                      
                      <View style={tw`flex-1 py-1`}>
                        <Text style={tw`text-[15px] font-bold text-slate-800`} numberOfLines={1}>{holiday.title}</Text>
                        <View style={tw`flex-row flex-wrap items-center gap-1.5 mt-1`}>
                          <View style={tw`px-2 py-0.5 rounded-full border border-white ${style.bg}`}>
                            <Text style={tw`text-[10px] font-bold uppercase ${style.text}`}>
                              {holiday.holidayType === 'custom' ? t('Calendar.faculty.event', 'Event') : holiday.holidayType.replace('_', ' ')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        {Array.from(holidaysByMonth.values()).every(arr => arr.length === 0) && (
          <View style={tw`w-full p-8 items-center justify-center bg-white rounded-2xl border border-slate-200 mt-4`}>
            <CalendarBlank size={48} color="#cbd5e1" weight="light" />
            <Text style={tw`text-slate-500 font-medium mt-4 text-center`}>{t('Calendar.faculty.noHolidaysScheduledFor', 'No holidays scheduled for')} {year}</Text>
          </View>
        )}
      </View>

      <ViewHolidayModal
        isOpen={!!holidayToView}
        onClose={() => setHolidayToView(null)}
        holiday={holidayToView}
      />
    </ScrollView>
  );
}

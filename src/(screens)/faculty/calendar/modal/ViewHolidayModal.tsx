import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Text } from '@/components/AppText';
import tw from 'twrnc';
import { X, CalendarBlank, Textbox } from "phosphor-react-native";
import { CollegeHoliday } from "@/lib/helpers/Hr/holidays/holidayAPI";

interface ViewHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holiday: CollegeHoliday | null;
}

const HOLIDAY_COLORS: Record<string, string> = {
  festival: "text-orange-600",
  weekly_off: "text-slate-600",
  government: "text-blue-600",
  emergency: "text-red-600",
  custom: "text-purple-600"
};

const HOLIDAY_BG: Record<string, string> = {
  festival: "bg-orange-50",
  weekly_off: "bg-slate-50",
  government: "bg-blue-50",
  emergency: "bg-red-50",
  custom: "bg-purple-50"
};

export default function ViewHolidayModal({ isOpen, onClose, holiday }: ViewHolidayModalProps) {
  const { t } = useTranslation();
  if (!holiday) return null;

  const dateObj = new Date(holiday.holidayDate);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const fullMonth = dateObj.toLocaleDateString('en-US', { month: 'long' });
  const year = dateObj.getFullYear();
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

  const textColorClass = HOLIDAY_COLORS[holiday.holidayType] || HOLIDAY_COLORS.custom;
  const bgColorClass = HOLIDAY_BG[holiday.holidayType] || HOLIDAY_BG.custom;
  
  const displayType = holiday.holidayType === 'custom' ? t('Calendar.faculty.institutionalEvent', 'Institutional Event') : holiday.holidayType.replace('_', ' ');

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose} 
        style={tw`flex-1 bg-black/40 justify-center items-center p-4`}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={tw`w-full max-w-sm bg-white rounded-2xl overflow-hidden`}
        >
          {/* Header section */}
          <View style={tw`px-6 py-8 ${bgColorClass}`}>
            <TouchableOpacity 
              onPress={onClose} 
              style={tw`absolute top-4 right-4 bg-white/50 p-2 rounded-full z-10`}
            >
              <X size={18} color="#94a3b8" weight="bold" />
            </TouchableOpacity>

            <View style={tw`flex-row items-center gap-4`}>
              {/* Date Box */}
              <View style={tw`w-20 h-20 bg-white rounded-xl items-center justify-center border border-white/50 shadow-sm`}>
                <Text style={tw`text-xs font-bold uppercase ${textColorClass}`}>{month}</Text>
                <Text style={tw`text-3xl font-black mt-1 ${textColorClass}`}>{day}</Text>
              </View>

              {/* Title & Badge */}
              <View style={tw`flex-1`}>
                <Text style={tw`text-xl font-bold text-slate-800`} numberOfLines={2}>{holiday.title}</Text>
                <View style={tw`flex-row flex-wrap items-center gap-2 mt-2`}>
                  <View style={tw`px-2.5 py-1 rounded-full border border-slate-200 bg-white`}>
                    <Text style={tw`text-xs font-bold uppercase ${textColorClass}`}>{displayType}</Text>
                  </View>
                  <View style={tw`px-3 py-1 rounded-full bg-white/60`}>
                    <Text style={tw`text-sm font-medium text-slate-500`}>{year}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Body Section */}
          <ScrollView style={tw`p-6 bg-white max-h-80`}>
            {/* Day */}
            <View style={tw`flex-row items-center gap-4 mb-6`}>
              <View style={tw`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center`}>
                <CalendarBlank size={20} color="#94a3b8" weight="fill" />
              </View>
              <View>
                <Text style={tw`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5`}>{t('Calendar.faculty.day', 'Day')}</Text>
                <Text style={tw`text-sm font-medium text-slate-700`}>{dayName}, {fullMonth} {day}, {year}</Text>
              </View>
            </View>

            {/* Description */}
            <View style={tw`flex-row items-start gap-4 mb-4`}>
              <View style={tw`w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center mt-1`}>
                <Textbox size={20} color="#94a3b8" weight="fill" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1`}>{t('Calendar.faculty.description', 'Description')}</Text>
                <Text style={tw`text-sm text-slate-600 leading-5`}>
                  {holiday.description || t('Calendar.faculty.noDescriptionProvided', 'No description provided.')}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={tw`px-6 py-4 bg-slate-50 border-t border-slate-100 items-end`}>
            <TouchableOpacity 
              onPress={onClose}
              style={tw`px-6 py-2 bg-white border border-slate-200 rounded-xl shadow-sm`}
            >
              <Text style={tw`text-slate-600 font-semibold`}>{t('Calendar.faculty.close', 'Close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

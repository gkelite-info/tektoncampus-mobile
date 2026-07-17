import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';

export interface ConflictingSection {
  facultyName: string;
  subjectName: string;
  sectionName: string;
  fromTime: string;
  toTime: string;
}

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  conflictDetails?: ConflictingSection[];
}

export default function ConfirmConflictModal({
  open,
  onConfirm,
  onCancel,
  conflictDetails,
}: Props) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/40 justify-center items-center px-4">
        <View className="bg-white rounded-xl w-full max-w-[400px] p-6 shadow-xl">
          <Text className="text-lg font-semibold text-[#1F2937] mb-2">
            {t("Calendar.faculty.scheduleConflict", "Schedule Conflict")}
          </Text>

          <Text className="text-sm text-[#525252] mb-5 leading-relaxed">
            {t("Calendar.faculty.conflictMsg", "A class is already scheduled for this section during this time slot.\nDo you still want to add this event anyway?")}
          </Text>

          {conflictDetails && conflictDetails.length > 0 && (
            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <Text className="text-[11px] font-semibold uppercase tracking-wider text-red-700 mb-3">
                {t("Calendar.faculty.conflictingSchedule", "Conflicting Schedule")}
              </Text>
              <ScrollView className="max-h-48" showsVerticalScrollIndicator={false}>
                {conflictDetails.map((c, i) => (
                  <View
                    key={i}
                    className={`pt-3 ${i === 0 ? 'pt-0' : 'border-t border-red-100 mt-3'}`}
                  >
                    <Text className="text-sm text-red-900 mb-1">
                      <Text className="font-semibold">{t("Auto.Common.Faculty", "Faculty")}:</Text> {c.facultyName}
                    </Text>
                    <Text className="text-sm text-red-900 mb-1">
                      <Text className="font-semibold">{t("Auto.Common.Subject", "Subject")}:</Text> {c.subjectName}
                    </Text>
                    <Text className="text-sm text-red-900 mb-1">
                      <Text className="font-semibold">{t("Auto.Common.Section", "Section")}:</Text> {c.sectionName}
                    </Text>
                    <Text className="text-sm text-red-900">
                      <Text className="font-semibold">{t("Auto.Attr.Time", "Time")}:</Text> {c.fromTime} – {c.toTime}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white"
            >
              <Text className="text-sm text-gray-600 font-medium">{t("Auto.Common.Cancel", "Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              className="px-6 py-2 rounded-lg bg-[#14234B]"
            >
              <Text className="text-white text-sm font-medium">{t("Calendar.faculty.confirmAnyway", "Confirm Anyway")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

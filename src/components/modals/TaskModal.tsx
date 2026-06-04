import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { X, CalendarBlank, Clock } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useTranslation } from "react-i18next";

export type TaskPayload = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
};

type TaskModalProps = {
  open: boolean;
  role?: "faculty" | "student";
  collegeSubjectId?: number;
  facultyId?: number;
  studentId?: number;
  onClose: () => void;

  defaultValues?: {
    facultyTaskId: number;
    title: string;
    description: string;
    time: string;
    date: string;
  } | null;

  onSave: (
    payload: {
      title: string;
      description: string;
      dueDate: string;
      dueTime: string;
    },
    taskId?: number,
  ) => Promise<void>;
};

export default function TaskModal({
  open,
  role,
  collegeSubjectId,
  facultyId,
  studentId,
  onClose,
  onSave,
  defaultValues,
}: TaskModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [saving, setSaving] = useState(false);

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  useEffect(() => {
    if (defaultValues?.facultyTaskId) {
      setTitle(defaultValues.title);
      setDescription(defaultValues.description);
      setDueTime(defaultValues.time);
      setDueDate(defaultValues.date ?? new Date().toISOString().split("T")[0]);
    } else {
      setTitle("");
      setDescription("");
      setDueDate("");
      setDueTime("");
    }
  }, [defaultValues, open]);

  if (!open) return null;

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setDueTime("");
    onClose();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Toast.show({ type: "error", text1: t("Task title is required.") });
      return;
    }

    if (!description.trim()) {
      Toast.show({ type: "error", text1: t("Description is required.") });
      return;
    }

    if (!dueDate) {
      Toast.show({ type: "error", text1: t("Please select a date.") });
      return;
    }

    if (!dueTime) {
      Toast.show({ type: "error", text1: t("Please select a time.") });
      return;
    }

    try {
      setSaving(true);
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          dueDate,
          dueTime,
        },
        defaultValues?.facultyTaskId,
      );

      Toast.show({
        type: "success",
        text1: defaultValues
          ? t("Task updated successfully")
          : t("Task created successfully"),
      });

      handleCancel();
    } catch (err) {
      Toast.show({ type: "error", text1: t("Failed to save task") });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDate = (date: Date) => {
    setDueDate(date.toISOString().split("T")[0]);
    setDatePickerVisibility(false);
  };

  const handleConfirmTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    setDueTime(`${hours}:${minutes}`);
    setTimePickerVisibility(false);
  };

  const formatDisplayTime = (time24: string) => {
    if (!time24) return t("Select Time");
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${m} ${ampm}`;
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 20}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <View className="px-5 py-4 flex-row items-center justify-between border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">
                {defaultValues ? t("Edit Task") : t("Add Task")}
              </Text>
              <TouchableOpacity onPress={handleCancel} className="p-1 rounded-full bg-gray-100">
                <X size={20} color="#374151" weight="bold" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5" keyboardShouldPersistTaps="handled">
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                  {t("Task Title")} <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder={t("Enter task title")}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 bg-white"
                />
              </View>

              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                  {t("Description / Notes")} <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t("Enter task description")}
                  multiline
                  numberOfLines={4}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 bg-white min-h-[100px]"
                  style={{ textAlignVertical: "top" }}
                />
              </View>

              <Text className="text-sm font-bold text-gray-800 mb-3">{t("Schedule")}</Text>

              <View className="flex-row justify-between mb-6">
                <View className="w-[48%]">
                  <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                    {t("Date")} <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setDatePickerVisibility(true)}
                    className="border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between"
                  >
                    <Text className={`text-sm ${dueDate ? "text-gray-800" : "text-gray-400"}`}>
                      {dueDate || t("Select Date")}
                    </Text>
                    <CalendarBlank size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View className="w-[48%]">
                  <Text className="text-sm font-semibold text-gray-700 mb-1.5">
                    {t("Time")} <Text className="text-red-500">*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => setTimePickerVisibility(true)}
                    className="border border-gray-300 rounded-lg px-3 py-3 bg-white flex-row items-center justify-between"
                  >
                    <Text className={`text-sm ${dueTime ? "text-gray-800" : "text-gray-400"}`}>
                      {formatDisplayTime(dueTime)}
                    </Text>
                    <Clock size={16} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row justify-between gap-3">
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  className={`flex-1 py-3.5 rounded-xl items-center justify-center ${saving ? "bg-[#A7DDBE]" : "bg-[#43C17A]"}`}
                >
                  <Text className="text-white font-bold text-sm">
                    {saving ? t("Saving...") : t("Save task")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancel}
                  className="flex-1 border border-gray-300 py-3.5 rounded-xl items-center justify-center bg-gray-50"
                >
                  <Text className="text-gray-700 font-bold text-sm">{t("Cancel")}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          minimumDate={new Date()}
          onConfirm={handleConfirmDate}
          onCancel={() => setDatePickerVisibility(false)}
        />
        
        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirmTime}
          onCancel={() => setTimePickerVisibility(false)}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

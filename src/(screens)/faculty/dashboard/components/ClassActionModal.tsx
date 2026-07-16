import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { X } from "phosphor-react-native";
import { UpcomingLesson } from "@/lib/helpers/faculty/attendance/getClasses";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: UpcomingLesson | null;
  onAccept: (id: string) => Promise<void>;
  onCancelClass: (id: string, reason: string) => Promise<void>;
}

export const ClassActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  lesson,
  onAccept,
  onCancelClass
}) => {const { t } = useTranslation();
  const [step, setStep] = useState<"initial" | "confirm_accept" | "cancel_reason">("initial");
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep("initial");
      setReason("");
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen || !lesson) return null;

  const isAccepted = lesson.sessionStatus === "Accepted";
  const isCancelled = lesson.sessionStatus === "Cancel";

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
          <View className="flex-1 items-center justify-center bg-black/50 p-4 min-h-screen">
            <View className="bg-white rounded-2xl shadow-xl w-full max-w-[500px]">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Text className="text-lg text-gray-900" style={{ fontFamily: fonts.bold }}>
              {step === "initial" && "Add Upcoming Class"}
              {step === "confirm_accept" && "Confirm Acceptance"}
              {step === "cancel_reason" && "Cancel Class"}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isProcessing}>
              <X size={20} weight="bold" color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {step === "initial" &&
              <>
              <View className="px-5 py-4 space-y-4">
                <View className="space-y-1 mb-3">
                  <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ClassTitle", "Class Title")}</Text>
                  <View className="w-full px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Text className="text-sm text-gray-700" style={{ fontFamily: fonts.medium }}>
                      {`${lesson.degree} - Year ${lesson.year} - Section ${lesson.section ?? "N/A"}\n${lesson.title}`}
                    </Text>
                  </View>
                </View>

                <View className="space-y-1 mb-3">
                  <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Topic", "Topic")}</Text>
                  <View className="w-full px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Text className="text-sm text-gray-700" style={{ fontFamily: fonts.medium }}>{lesson.description || "No topic specified"}</Text>
                  </View>
                </View>

                <View className="space-y-1 mb-3">
                  <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ClassDate", "Class Date")}</Text>
                  <View className="w-full px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Text className="text-sm text-gray-700" style={{ fontFamily: fonts.medium }}>{lesson.date || "NULL"}</Text>
                  </View>
                </View>

                <View className="space-y-1 mb-3">
                  <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ClassTime", "Class Time")}</Text>
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Text className="text-sm text-center text-gray-700" style={{ fontFamily: fonts.medium }}>{lesson.fromTime || "NULL"}</Text>
                    </View>
                    <Text className="text-sm text-gray-400" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.to", "to")}</Text>
                    <View className="flex-1 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                      <Text className="text-sm text-center text-gray-700" style={{ fontFamily: fonts.medium }}>{lesson.toTime || "NULL"}</Text>
                    </View>
                  </View>
                </View>

                <View className="space-y-1 mb-1">
                  <Text className="text-xs text-gray-500 mb-1 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Classroom", "Classroom")}</Text>
                  <View className="w-full px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <Text className="text-sm text-gray-700" style={{ fontFamily: fonts.medium }}>{lesson.roomNo || "NULL"}</Text>
                  </View>
                </View>
              </View>

              <View className="px-5 py-4 flex-row gap-3">
                <TouchableOpacity
                    onPress={() => {
                      if (!isAccepted) setStep("confirm_accept");
                    }}
                    disabled={isAccepted}
                    className={`flex-1 items-center justify-center py-3.5 rounded-xl ${
                    isAccepted ? "bg-gray-200" : "bg-[#43C17A]"}`
                    }>
                    
                  <Text className={`text-sm ${isAccepted ? "text-gray-500" : "text-white"}`} style={{ fontFamily: fonts.bold }}>
                    {isAccepted ? "Accepted" : "Accept"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                      if (!isCancelled) setStep("cancel_reason");
                    }}
                    disabled={isCancelled}
                    className={`flex-1 items-center justify-center py-3.5 rounded-xl ${
                    isCancelled ? "bg-gray-200" : "bg-red-500"}`
                    }>
                    
                  <Text className={`text-sm ${isCancelled ? "text-gray-500" : "text-white"}`} style={{ fontFamily: fonts.bold }}>
                    {isCancelled ? "Cancelled" : "Cancel Class"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
              }

          {step === "confirm_accept" &&
              <>
              <View className="px-5 py-8 items-center">
                <Text className="text-gray-900 text-lg text-center mb-2" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Areyousureyouwa", "Are you sure you want to accept this class?")}</Text>
                <Text className="text-sm text-gray-500 text-center" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Thiswillofficia", "This will officially mark the class as accepted and redirect to Attendance.")}</Text>
              </View>
              <View className="px-5 py-4 flex-row gap-3">
                <TouchableOpacity
                    onPress={async () => {
                      setIsProcessing(true);
                      await onAccept(lesson.id);
                    }}
                    disabled={isProcessing}
                    className="flex-1 items-center justify-center bg-[#43C17A] py-3.5 rounded-xl flex-row">
                    
                  {isProcessing ?
                    <ActivityIndicator size="small" color="white" /> :

                    <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.YesAccept", "Yes, Accept")}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep("initial")}
                    disabled={isProcessing}
                    className="flex-1 items-center justify-center bg-gray-100 py-3.5 rounded-xl">
                    
                  <Text className="text-gray-700 text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Back", "Back")}</Text>
                </TouchableOpacity>
              </View>
            </>
              }

          {step === "cancel_reason" &&
              <>
              <View className="px-5 py-4">
                <Text className="text-xs text-gray-700 mb-2 uppercase tracking-wider" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ReasonforCancel", "Reason for Cancellation")}</Text>
                <TextInput
                    value={reason}
                    onChangeText={setReason}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-gray-50"
                    placeholder={t("Auto.Attr.EnterareasonReq", "Enter a reason (Required)...")}
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: 'top' }} />
                  
              </View>
              <View className="px-5 py-4 flex-row gap-3">
                <TouchableOpacity
                    onPress={async () => {
                      if (!reason.trim()) {
                        Toast.show({ type: 'error', text1: "Please enter a reason." });
                        return;
                      }
                      setIsProcessing(true);
                      await onCancelClass(lesson.id, reason);
                      setIsProcessing(false);
                    }}
                    disabled={isProcessing}
                    className="flex-1 items-center justify-center bg-red-500 py-3.5 rounded-xl flex-row">
                    
                   {isProcessing ?
                    <ActivityIndicator size="small" color="white" /> :

                    <Text className="text-white text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.ConfirmCancel", "Confirm Cancel")}</Text>
                    }
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setStep("initial")}
                    disabled={isProcessing}
                    className="flex-1 items-center justify-center bg-gray-100 py-3.5 rounded-xl">
                    
                  <Text className="text-gray-700 text-sm" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Back", "Back")}</Text>
                </TouchableOpacity>
              </View>
            </>
              }
        </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>);

};
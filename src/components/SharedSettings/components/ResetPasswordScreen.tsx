import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeSlash, CaretLeft } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import PasswordChecklist from "./PasswordChecklist";
import { updateUserPassword } from "@/lib/helpers/settings/passwordAPI";
import { fonts } from "@/constants/fonts";

export default function ResetPasswordScreen() {const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpdate = async () => {
    if (!newPwd || !confirmPwd) {
      Toast.show({ type: "error", text1: t("Please fill out both password fields.") });
      return;
    }

    if (newPwd !== confirmPwd) {
      Toast.show({ type: "error", text1: t("Passwords do not match.") });
      return;
    }

    const isValidLength = newPwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPwd);
    const hasNumber = /[0-9]/.test(newPwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPwd);

    if (!isValidLength || !hasUppercase || !hasNumber || !hasSpecial) {
      Toast.show({ type: "error", text1: t("Please ensure the password meets all requirements.") });
      return;
    }

    setIsProcessing(true);
    Toast.show({ type: "info", text1: t("Updating password..."), autoHide: false });

    try {
      await updateUserPassword(newPwd);
      Toast.hide();
      Toast.show({ type: "success", text1: t("Password updated successfully!") });
      navigation.replace(t("PasswordDone"));
    } catch (error: any) {
      Toast.hide();
      Toast.show({ type: "error", text1: error.message || t("Failed to update password.") });
    } finally {
      setIsProcessing(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? t("padding") : undefined}
      className="flex-1 bg-[#F4F5F6]">
      
      <ScrollView className="flex-1 px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1 -ml-1 mr-2 rounded-full hover:bg-gray-200">
            
            <CaretLeft size={24} color="#282828" weight="bold" />
          </TouchableOpacity>
          <View>
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.CreateNewPasswo", "Create New Password")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Secureyouraccou", "Secure your account with a new password")}

            </Text>
          </View>
        </View>

        {/* Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-[#ECEFF1] mb-8">
          <Text className="text-[14px] text-[#282828] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.NewPassword", "New Password")}

          </Text>
          
          <View className="relative justify-center mb-4">
            <TextInput
              secureTextEntry={!showNew}
              value={newPwd}
              onChangeText={setNewPwd}
              editable={!isProcessing}
              placeholder={t("Auto.Attr.Newpassword", "New password")}
              placeholderTextColor="#9CA3AF"
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-[14px] text-[#282828]"
              style={{ fontFamily: fonts.regular }} />
            
            <TouchableOpacity
              onPress={() => setShowNew(!showNew)}
              disabled={isProcessing}
              className="absolute right-3 p-1">
              
              {showNew ?
              <Eye size={20} color="#6B7280" /> :

              <EyeSlash size={20} color="#6B7280" />
              }
            </TouchableOpacity>
          </View>

          <PasswordChecklist password={newPwd} />

          <Text className="text-[14px] text-[#282828] mb-2 mt-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.ConfirmNewPassw", "Confirm New Password")}

          </Text>
          
          <View className="relative justify-center mb-6">
            <TextInput
              secureTextEntry={!showConfirm}
              value={confirmPwd}
              onChangeText={setConfirmPwd}
              editable={!isProcessing}
              placeholder={t("Auto.Attr.Confirmnewpassw", "Confirm new password")}
              placeholderTextColor="#9CA3AF"
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-[14px] text-[#282828]"
              style={{ fontFamily: fonts.regular }} />
            
            <TouchableOpacity
              onPress={() => setShowConfirm(!showConfirm)}
              disabled={isProcessing}
              className="absolute right-3 p-1">
              
              {showConfirm ?
              <Eye size={20} color="#6B7280" /> :

              <EyeSlash size={20} color="#6B7280" />
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl flex-row items-center justify-center ${isProcessing ? 'bg-[#a1e0bd]' : 'bg-[#43C17A]'}`}>
            
            {isProcessing && <ActivityIndicator size="small" color="white" className="mr-2" />}
            <Text className="text-white text-[15px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.UpdatePassword", "Update Password")}

            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>);

}
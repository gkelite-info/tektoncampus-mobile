import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeSlash, CaretLeft } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useUser } from "@/utils/context/UserContext";
import { verifyCurrentPassword, sendPasswordResetEmail } from "@/lib/helpers/settings/passwordAPI";
import { fonts } from "@/constants/fonts";

export default function VerifyPasswordScreen() {const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { email } = useUser();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (!password) {
      Toast.show({ type: "error", text1: t("Please enter your current password.") });
      return;
    }
    if (!email) {
      Toast.show({ type: "error", text1: t("User email not found.") });
      return;
    }

    setIsProcessing(true);
    Toast.show({ type: "info", text1: t("Verifying password..."), autoHide: false });

    try {
      await verifyCurrentPassword(email, password);
      Toast.hide();
      Toast.show({ type: "success", text1: t("Password verified!") });
      navigation.replace("ResetPassword");
    } catch (error: any) {
      Toast.hide();
      Toast.show({ type: "error", text1: t("Incorrect password. Please try again.") });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return;

    Toast.show({ type: "info", text1: t("Sending reset link..."), autoHide: false });

    try {
      await sendPasswordResetEmail(email);
      Toast.hide();
      Toast.show({ type: "success", text1: t("Password reset link sent to your email!") });
    } catch (error: any) {
      Toast.hide();
      Toast.show({ type: "error", text1: error.message || t("Failed to send reset link.") });
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#F4F5F6]">
      
      <View className="flex-1 px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1 -ml-1 mr-2 rounded-full hover:bg-gray-200">
            
            <CaretLeft size={24} color="#282828" weight="bold" />
          </TouchableOpacity>
          <View>
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.CurrentPassword", "Current Password")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.VerifyYourCurre", "Verify Your Current Account Password")}

            </Text>
          </View>
        </View>

        {/* Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-[#ECEFF1]">
          <Text className="text-[14px] text-[#111827] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CurrentPassword", "Current Password")}

          </Text>
          
          <View className="relative justify-center mb-1">
            <TextInput
              secureTextEntry={!show}
              value={password}
              onChangeText={setPassword}
              editable={!isProcessing}
              placeholder="*******"
              placeholderTextColor="#9CA3AF"
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 text-[14px] text-[#616161]"
              style={{ fontFamily: fonts.regular }} />
            
            <TouchableOpacity
              onPress={() => setShow(!show)}
              disabled={isProcessing}
              className="absolute right-3 p-1">
              
              {show ?
              <Eye size={20} color="#6B7280" /> :

              <EyeSlash size={20} color="#6B7280" />
              }
            </TouchableOpacity>
          </View>
          
          <Text className="text-[12px] text-gray-500 mb-6" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Enteryourexisti", "Enter your existing password")}

          </Text>

          <TouchableOpacity
            onPress={handleForgotPassword}
            className="mb-6 self-center">
            
            <Text className="text-[14px] text-[#10B981]" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Forgotyourpassw", "Forgot your password?")}

            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            disabled={isProcessing}
            className={`w-full py-3.5 rounded-xl flex-row items-center justify-center ${isProcessing ? 'bg-[#a1e0bd]' : 'bg-[#43C17A]'}`}>
            
            {isProcessing && <ActivityIndicator size="small" color="white" className="mr-2" />}
            <Text className="text-white text-[15px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Continue", "Continue")}

            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>);

}
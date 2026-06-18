import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatTeardropText, EnvelopeSimple, Key, Monitor, CaretRight, CaretLeft } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";

export interface VerificationMethod {
  id: string;
  name: string;
  icon: any;
  status: "toggle" | "navigate";
  enabled: boolean;
}

const initialVerificationData: VerificationMethod[] = [
{ id: "sms", name: "SMS Verification", icon: ChatTeardropText, status: "toggle", enabled: true },
{ id: "email", name: "Email Verification", icon: EnvelopeSimple, status: "toggle", enabled: true },
{ id: "authenticator", name: "Authenticator App", icon: Key, status: "toggle", enabled: true },
{ id: "devices", name: "Trusted Devices List", icon: Monitor, status: "navigate", enabled: false }];


export default function TwoStepVerificationScreen() {const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [methods, setMethods] = useState<VerificationMethod[]>(initialVerificationData);

  const handleToggleOrNavigate = (methodId: string) => {
    const method = methods.find((m) => m.id === methodId);
    if (!method) return;

    if (method.status === "navigate") {
      if (method.id === "devices") {
        navigation.navigate("TrustedDevices");
      }
    } else {
      setMethods((prev) => prev.map((m) => m.id === methodId ? { ...m, enabled: !m.enabled } : m));
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F4F5F6]">
      <ScrollView className="flex-1 px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }}>
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1 -ml-1 mr-2 rounded-full hover:bg-gray-200">
            
            <CaretLeft size={24} color="#282828" weight="bold" />
          </TouchableOpacity>
          <View>
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.TwoStepVerifica", "Two-Step Verification")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Addanextralayer", "Add an extra layer of security to your account")}

            </Text>
          </View>
        </View>

        {/* List wrapped with WIP Overlay equivalent */}
        <View className="relative bg-white p-4 rounded-2xl border border-[#ECEFF1] shadow-sm mb-6 overflow-hidden">
          
          <View className="z-0">
            {methods.map((method) => {
              const Icon = method.icon;
              return (
                <TouchableOpacity
                  key={method.id}
                  activeOpacity={method.status === "navigate" ? 0.7 : 1}
                  onPress={method.status === "navigate" ? () => handleToggleOrNavigate(method.id) : undefined}
                  className="flex-row items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm mb-3">
                  
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className="p-2.5 rounded-full bg-green-50 mr-3">
                      <Icon size={22} color="#22C55E" weight="bold" />
                    </View>
                    <Text className="text-[15px] text-[#282828]" style={{ fontFamily: fonts.medium }}>
                      {method.name}
                    </Text>
                  </View>

                  {method.status === "toggle" ?
                  <Switch
                    value={method.enabled}
                    onValueChange={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleToggleOrNavigate(method.id);
                    }}
                    trackColor={{ false: "#D1D5DB", true: "#43C17A" }}
                    thumbColor="#fff" /> :


                  <CaretRight size={20} color="#9CA3AF" weight="bold" />
                  }
                </TouchableOpacity>);

            })}
            
            <Text className="text-center text-[13px] text-gray-500 mt-4" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Werecommendenab", "We recommend enabling at least one verification method.")}

            </Text>
          </View>

          {/* WIP Overlay overlay */}
          <View className="absolute inset-0 z-10 bg-white/70 items-center justify-center">
            <View className="bg-white/90 px-4 py-3 rounded-xl shadow-sm border border-gray-100 items-center">
              <Text className="text-[14px] text-[#16284F] mb-1" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.IntegrationinPr", "Integration in Progress")}

              </Text>
              <Text className="text-[11px] text-gray-500 text-center" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.PreviewLayout", "Preview Layout")}

              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>);

}
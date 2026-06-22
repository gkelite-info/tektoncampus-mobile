import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { CaretLeft, ShieldCheck } from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";

export default function PrivacyPolicyScreen() {const { t } = useTranslation();
  const navigation = useNavigation();

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
            <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.PrivacyPolicy", "Privacy Policy")}

            </Text>
            <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.LastupdatedApri", "Last updated: April 2026")}

            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="bg-white p-5 rounded-2xl border border-[#ECEFF1] shadow-sm mb-8">
          <View className="flex-row items-center mb-5 pb-4 border-b border-gray-100">
            <View className="p-2.5 rounded-full bg-[#43C17A26] mr-3">
              <ShieldCheck size={24} color="#43C17A" weight="fill" />
            </View>
            <Text className="text-[18px] text-[#282828] flex-1" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.TektonCampusPri", "Tekton Campus Privacy Policy")}

            </Text>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-[15px] text-[#111827] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.1InformationWeC", "1. Information We Collect")}

              </Text>
              <Text className="text-[13px] text-gray-600 leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Wecollectinform", "We collect information you provide directly to us when you create an account, update your profile, use the interactive features of the ERP, or communicate with us. This may include your name, email address, student ID, academic records, and contact details.")}

              </Text>
            </View>

            <View>
              <Text className="text-[15px] text-[#111827] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.2HowWeUseYourIn", "2. How We Use Your Information")}

              </Text>
              <Text className="text-[13px] text-gray-600 leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Weusetheinforma", "We use the information we collect to provide, maintain, and improve our services. This includes managing your academic journey, processing enrollments, sending necessary notifications (such as course updates and event reminders), and providing user support.")}

              </Text>
            </View>

            <View>
              <Text className="text-[15px] text-[#111827] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.3DataSecurity", "3. Data Security")}

              </Text>
              <Text className="text-[13px] text-gray-600 leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Weimplementappr", "We implement appropriate technical and organizational measures designed to protect your personal data against accidental or unlawful destruction, loss, alteration, and unauthorized disclosure or access. We utilize industry-standard encryption and secure server hosting.")}

              </Text>
            </View>

            <View>
              <Text className="text-[15px] text-[#111827] mb-2" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.4YourRights", "4. Your Rights")}

              </Text>
              <Text className="text-[13px] text-gray-600 leading-5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Youhavetheright", "You have the right to access, update, or delete your personal information. You can manage many of these preferences directly through this settings dashboard. For data requests that cannot be fulfilled via the dashboard, please contact campus administration.")}

              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>);

}
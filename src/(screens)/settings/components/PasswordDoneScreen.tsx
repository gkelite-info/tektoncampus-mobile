import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/fonts";

export default function PasswordDoneScreen() {const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-[#F4F5F6] px-4" style={{ paddingTop: Math.max(insets.top, 12) + 120 }}>
      {/* Header */}
      <View className="mb-6 mt-6">
        <Text className="text-[20px] text-[#282828]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.CurrentPassword", "Current Password")}

        </Text>
        <Text className="text-[13px] text-gray-500 mt-0.5" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.UpdateYourCurre", "Update Your Current Account Password")}

        </Text>
      </View>

      <View className="flex-1 items-center justify-center -mt-20">
        <View className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm items-center border border-[#ECEFF1]">
          <Text className="text-[20px] text-[#282828] mb-2" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Passwordupdated", "Password updated")}

          </Text>
          <Text className="text-[14px] text-gray-600 mb-8 text-center" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Yourpasswordhas", "Your password has been successfully changed.")}

          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate("SettingsMain")}
            className="w-full bg-[#43C17A] py-3.5 rounded-xl items-center">
            
            <Text className="text-white text-[15px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.BacktoSettings", "Back to Settings")}

            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>);

}
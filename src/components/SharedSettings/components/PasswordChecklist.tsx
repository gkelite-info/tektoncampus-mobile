import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View } from 'react-native';
import { CheckCircle } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";

interface PasswordChecklistProps {
  password: string;
}

export default function PasswordChecklist({ password }: PasswordChecklistProps) {const { t } = useTranslation();
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const Row = (ok: boolean, label: string) =>
  <View className="flex-row items-center gap-2 mb-2">
      <CheckCircle
      size={16}
      weight="fill"
      color={ok ? "#10B981" : "#D1D5DB"} />
    
      <Text
      className={`text-[13px] ${ok ? "text-gray-700" : "text-gray-400"}`}
      style={{ fontFamily: fonts.regular }}>
      
        {label}
      </Text>
    </View>;


  return (
    <View className="mb-4">
      {Row(checks.length, t("At Least 8 Characters"))}
      {Row(checks.uppercase, t("One Uppercase Letter"))}
      {Row(checks.number, t("One Number"))}
      {Row(checks.special, t("One Special Character"))}
    </View>);

}
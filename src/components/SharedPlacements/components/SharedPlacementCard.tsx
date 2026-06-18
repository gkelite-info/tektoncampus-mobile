import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, Image } from 'react-native';
import { Buildings, ClockCountdown, MapPin, CurrencyInr } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import { SharedPlacementCompany } from "../types/sharedPlacement.types";
import { formatDisplayDate, getClosingText } from "../utils/placementFormatters";
import { useTranslations } from "@/utils/useTranslations";
interface SharedPlacementCardProps {
  company: SharedPlacementCompany;
  role: "student" | "faculty";
  isApplied?: boolean;
  appliedOn?: string;
  isApplying?: boolean;
  statusLabel?: string;
  onApply?: () => void;
  onWithdraw?: () => void;
  onClick?: () => void;
}
export default function SharedPlacementCard({
  company,
  role,
  isApplied,
  appliedOn,
  isApplying,
  statusLabel,
  onApply,
  onWithdraw,
  onClick
}: SharedPlacementCardProps) {
  const {
    t
  } = useTranslation();
  const isStudent = role === "student";
  const renderStatusBadge = () => {
    
    if (statusLabel) {
      return <View className="px-3 py-1 bg-blue-50 rounded-lg">
                    <Text className="text-blue-700 text-[11px]" style={{
          fontFamily: fonts.bold
        }}>
                        {statusLabel}
                    </Text>
                </View>;
    }
    if (company.isExpired) {
      return <View className="px-3 py-1 bg-gray-100 rounded-lg">
                    <Text className="text-gray-600 text-[11px]" style={{
          fontFamily: fonts.bold
        }}>
                        {t("Completed")}
                    </Text>
                </View>;
    }
    return null;
  };
  return <TouchableOpacity activeOpacity={0.7} onPress={onClick} className="bg-white p-4 rounded-3xl border border-gray-100 mb-4">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1">
                    <View className="w-14 h-14 rounded-full border border-gray-100 items-center justify-center bg-white mr-3 overflow-hidden">
                        {company.logo ? <Image source={{
            uri: company.logo
          }} style={{
            width: '80%',
            height: '80%'
          }} resizeMode="contain" /> : <Buildings size={22} color="#94a3b8" weight="bold" />}
                    </View>
                    <View className="flex-1 pr-2">
                        <Text className="text-[#1E293B] text-lg leading-tight" style={{
            fontFamily: fonts.bold
          }}>
                            {company.name}
                        </Text>
                        <Text className="text-slate-500 text-sm mt-0.5" style={{
            fontFamily: fonts.medium
          }}>
                            {company.role || t("Multiple Roles")}
                        </Text>
                    </View>
                </View>
                {renderStatusBadge()}
            </View>

            {company.skills && company.skills.length > 0 && <View className="flex-row flex-wrap mb-3">
                    {company.skills.slice(0, 5).map((skill, index) => <View key={index} className="bg-emerald-50 px-2.5 py-1 rounded-full mr-2 mb-2">
                            <Text className="text-emerald-500 text-[10px]" style={{
          fontFamily: fonts.bold
        }}>
                                {skill}
                            </Text>
                        </View>)}
                </View>}

            {company.longDescription && <Text className="text-slate-500 text-xs leading-5 mb-4" numberOfLines={2} style={{
      fontFamily: fonts.regular
    }}>
                    {company.longDescription.replace(/<[^>]+>/g, '')}
                </Text>}

            <View className="flex-row flex-wrap items-center">
                <View className="flex-row items-center bg-gray-50 px-2 py-1.5 rounded-lg mr-2 mb-2">
                    <ClockCountdown size={12} color="#334155" weight="fill" />
                    <Text className="text-[#334155] text-[10px] ml-1" style={{
          fontFamily: fonts.bold
        }}>
                        {company.jobType || t("Full Time")}
                    </Text>
                </View>
                
                <View className="flex-row items-center bg-gray-50 px-2 py-1.5 rounded-lg mr-2 mb-2">
                    <MapPin size={12} color="#334155" weight="fill" />
                    <Text className="text-[#334155] text-[10px] ml-1" style={{
          fontFamily: fonts.bold
        }}>
                        {company.location || company.locations?.[0] || t("Multiple")}
                    </Text>
                </View>
                
                <View className="flex-row items-center bg-gray-50 px-2 py-1.5 rounded-lg mr-2 mb-2">
                    <CurrencyInr size={12} color="#334155" weight="bold" />
                    <Text className="text-[#334155] text-[10px] ml-1" style={{
          fontFamily: fonts.bold
        }}>
                        {company.packageDetails || t("Not specified")}
                    </Text>
                </View>

                <View className="flex-row items-center bg-amber-50 px-2 py-1.5 rounded-lg mb-2">
                    <ClockCountdown size={10} color="#F59E0B" weight="fill" />
                    <Text className="text-amber-600 text-[10px] ml-1.5" style={{
          fontFamily: fonts.bold
        }}>
                        {isApplied && appliedOn ? t("Applied on {date}", {
            date: formatDisplayDate(appliedOn)
          }) : company.isExpired ? t("Closed") : getClosingText(company.endDate, t)}
                    </Text>
                </View>
            </View>

            {isStudent && !company.isExpired && <View className="mt-2 pt-3 border-t border-gray-100 flex-row justify-between items-center">
                    <View className="flex-1 mr-3">
                        <Text className="text-slate-400 text-[10px]" style={{
          fontFamily: fonts.regular
        }}>{t("Eligibility")}</Text>
                        <Text className="text-[#334155] text-xs font-semibold mt-0.5" style={{
          fontFamily: fonts.medium
        }} numberOfLines={1}>
                            {company.eligibilityCriteria || t("Not specified")}
                        </Text>
                    </View>
                    
                    {isApplied ? <TouchableOpacity onPress={onWithdraw} className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                            <Text className="text-red-600 text-xs" style={{
          fontFamily: fonts.bold
        }}>
                                {t("Withdraw")}
                            </Text>
                        </TouchableOpacity> : <TouchableOpacity onPress={onApply} disabled={!company.isEligible || isApplying} className={`${company.isEligible ? "bg-[#43C17A]" : "bg-gray-300"} px-4 py-2 rounded-xl`}>
                            <Text className="text-white text-xs" style={{
          fontFamily: fonts.bold
        }}>
                                {isApplying ? t("Applying...") : t("Apply Now")}
                            </Text>
                        </TouchableOpacity>}
                </View>}
        </TouchableOpacity>;
}
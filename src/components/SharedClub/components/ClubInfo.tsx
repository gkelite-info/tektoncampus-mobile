import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React from "react";
import { View, ActivityIndicator } from 'react-native';
import tw from "twrnc";
import { Avatar } from "@/components/Avatar";

interface ClubInfoProps {
  info?: {
    name: string;
    logo: string;
    president: {name: string;role: string;avatar: string | null;};
    vicePresident: {name: string;role: string;avatar: string | null;};
    responsibleFaculty: {name: string;role: string;avatar: string | null;};
    mentors: {name: string;id: string;avatar: string | null;}[];
  } | null;
  isLoading?: boolean;
}

export default function ClubInfo({ info, isLoading = false }: ClubInfoProps) {const { t } = useTranslation();
  if (isLoading || !info) {
    return (
      <View style={tw`py-10 items-center justify-center`}>
                <ActivityIndicator size="large" color="#43C17A" />
            </View>);

  }

  const getRoleDisplayName = (role: string | undefined, defaultName: string) => {
    if (!role) return t(`SharedClub.roles.${defaultName.toLowerCase().replace(/\s+/g, "")}`, defaultName);
    const cleanedRole = role.toLowerCase().replace(/[^a-z]/g, "");
    switch (cleanedRole) {
      case "responsiblefaculty":
        return t("SharedClub.roles.responsibleFaculty", "Responsible Faculty");
      case "president":
        return t("SharedClub.roles.president", "President");
      case "vicepresident":
        return t("SharedClub.roles.vicePresident", "Vice President");
      case "mentor":
        return t("SharedClub.roles.mentor", "Mentor");
      default:
        return t(`SharedClub.roles.${cleanedRole}`, defaultName);
    }
  };

  return (
    <View style={tw`mb-8 items-center px-4`}>
            <View style={tw`mb-4 h-30 w-30 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white shadow-sm`}>
                <Avatar src={info.logo} size={120} />
            </View>
            <Text style={tw`mb-8 text-xl font-bold text-[#282828] text-center`}>{info.name}</Text>

            <View style={tw`w-full max-w-lg flex-col justify-between gap-8 md:flex-row`}>
                <View style={tw`flex-col gap-4`}>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Avatar src={info.responsibleFaculty?.avatar} size={40} />
                        <Text style={tw`text-sm font-bold text-[#16284F]`}>{info.responsibleFaculty?.name}</Text>
                        <View style={tw`rounded bg-[#E0E5FA] px-2 py-1 border border-[#465FAC]`}>
                            <Text style={tw`text-xs font-semibold text-[#16284F]`}>
                                {getRoleDisplayName(info.responsibleFaculty?.role, "Faculty")}
                            </Text>
                        </View>
                    </View>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Avatar src={info.president?.avatar} size={40} />
                        <Text style={tw`text-sm font-bold text-[#16284F]`}>{info.president?.name}</Text>
                        <View style={tw`rounded bg-[#E0E5FA] px-2 py-1 border border-[#465FAC]`}>
                            <Text style={tw`text-xs font-semibold text-[#16284F]`}>
                                {getRoleDisplayName(info.president?.role, "President")} 👑
                            </Text>
                        </View>
                    </View>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Avatar src={info.vicePresident?.avatar} size={40} />
                        <Text style={tw`text-sm font-bold text-[#16284F]`}>{info.vicePresident?.name}</Text>
                        <View style={tw`rounded bg-[#E0E5FA] px-2 py-1 border border-[#465FAC]`}>
                            <Text style={tw`text-xs font-semibold text-[#16284F]`}>
                                {getRoleDisplayName(info.vicePresident?.role, "Vice President")}
                            </Text>
                        </View>
                    </View>
                </View>

                {info.mentors && info.mentors.length > 0 &&
        <View style={tw`flex-col items-start mt-4`}>
                        <Text style={tw`mb-3 text-sm font-semibold text-[#484848]`}>{t("SharedClub.info.mentors", "Mentors:")}</Text>
                        <View style={tw`flex-row flex-wrap gap-4`}>
                            {info.mentors.map((mentor) =>
            <View key={mentor.id} style={tw`flex-col items-center gap-1.5`}>
                                    <Avatar src={mentor.avatar} size={40} />
                                    <Text style={tw`text-[11px] font-semibold text-[#16284F]`}>{mentor.name}</Text>
                                </View>
            )}
                        </View>
                    </View>
        }
            </View>
        </View>);

}
import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { FC } from "react";
import { View, Image } from 'react-native';
import { User, IdentificationCard, Buildings, Phone, Envelope, CalendarBlank, Briefcase } from "phosphor-react-native";
import { FacultyProfile } from "../types";
import { fonts } from "@/constants/fonts";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";

interface Props {
  profile: FacultyProfile;
  loading: boolean;
}

const DefaultAvatar = () =>
<View className="rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden" style={{ width: 56, height: 56 }}>
    <User size={26} color="#9CA3AF" weight="fill" />
  </View>;


const InfoRow = ({ icon: Icon, label, value, fullWidth = false }: {icon: any;label: string;value: string | null | undefined; fullWidth?: boolean}) =>
<View className="flex-row items-center mb-3" style={{ width: fullWidth ? '100%' : '48%' }}>
    <View className="rounded-full bg-[#43C17A]/10 items-center justify-center mr-2" style={{ width: 30, height: 30 }}>
      <Icon size={16} color="#43C17A" weight="duotone" />
    </View>
    <View className="flex-1">
      <Text className="text-gray-400 text-[10px] mb-0.5 uppercase tracking-wider" style={{ fontFamily: fonts.semiBold }}>{label}</Text>
      <Text className="text-[#333333] text-[12.5px]" style={{ fontFamily: fonts.semiBold }} numberOfLines={1} adjustsFontSizeToFit>
        {value || "—"}
      </Text>
    </View>
  </View>;


const FacultyInfoCard: FC<Props> = ({ profile, loading }) => {const { t } = useTranslation();
  const isInter = profile.collegeEducationType === "Inter";
  const isSchool = isSchoolEducation(profile.collegeEducationType);

  return (
    <View className="w-full md:flex-1 md:w-auto bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
      <View className="h-[6px] w-full bg-[#43C17A]" />
      
      <View className="p-4 flex-col">
        <View className="flex-row items-center w-full mb-4 pb-4 border-b border-gray-100">
          <View className="mr-3 rounded-full bg-white p-[2px] border border-gray-100 shadow-sm">
            {profile.image && profile.image.trim() !== "" ?
            <Image
              source={{ uri: profile.image }}
              className="rounded-full"
              style={{ width: 56, height: 56 }}
              resizeMode="cover" /> :
            <DefaultAvatar />
            }
          </View>
          <View className="flex-1">
             <Text className="text-[#1F2937] text-[17px]" style={{ fontFamily: fonts.bold }}>
               {profile.name}
             </Text>
             <View className="bg-[#43C17A]/10 px-2 py-0.5 rounded-md mt-1 self-start">
               <Text className="text-[#43C17A] text-[10px] uppercase tracking-widest" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Faculty", "Faculty").replace(":", "")}
              </Text>
             </View>
          </View>
        </View>

        <View className="flex-row flex-wrap w-full justify-between">
          <InfoRow icon={IdentificationCard} label={t("Auto.Attr.FacultyID", "Faculty ID")} value={!loading ? profile.facultyId : "..."} />
          {!isSchool && <InfoRow icon={Buildings} label={isInter ? "Group" : "Branch"} value={profile.branch} />}
          <InfoRow icon={Phone} label={t("Auto.Attr.Mobile", "Mobile")} value={profile.mobile} />
          <InfoRow icon={Briefcase} label={t("Auto.Attr.Experience", "Experience")} value={profile.experience} />
          <InfoRow icon={CalendarBlank} label={t("Auto.Attr.DateofJoining", "Date of Joining")} value={profile.joiningDate} />
          <InfoRow icon={Envelope} label={t("Auto.Common.Email", "Email")} value={profile.email} />
        </View>
      </View>
    </View>);

};

export default FacultyInfoCard;
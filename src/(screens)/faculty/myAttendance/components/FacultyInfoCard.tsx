import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { FC } from "react";
import { View, Image } from 'react-native';
import { User, IdentificationCard, Buildings, Phone, Envelope, CalendarBlank, Briefcase } from "phosphor-react-native";
import { FacultyProfile } from "../types";
import { fonts } from "@/constants/fonts";

interface Props {
  profile: FacultyProfile;
  loading: boolean;
}

const DefaultAvatar = () =>
<View className="w-[72px] h-[72px] rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
    <User size={32} color="#9CA3AF" weight="fill" />
  </View>;


const InfoRow = ({ icon: Icon, label, value }: {icon: any;label: string;value: string | null | undefined;}) =>
<View className="w-full md:w-1/2 flex-row items-center mb-4 md:mb-5">
    <View className="w-[36px] h-[36px] rounded-full bg-[#43C17A]/10 items-center justify-center mr-3">
      <Icon size={18} color="#43C17A" weight="duotone" />
    </View>
    <View className="flex-1 pr-2">
      <Text className="text-gray-400 text-[11px] mb-0.5 uppercase tracking-wider" style={{ fontFamily: fonts.semiBold }}>{label}</Text>
      <Text className="text-[#333333] text-[13.5px]" style={{ fontFamily: fonts.semiBold }} numberOfLines={1} adjustsFontSizeToFit>
        {value || "—"}
      </Text>
    </View>
  </View>;


const FacultyInfoCard: FC<Props> = ({ profile, loading }) => {const { t } = useTranslation();
  const isInter = profile.collegeEducationType === "Inter";

  return (
    <View className="w-full md:flex-1 md:w-auto bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
      <View className="h-[6px] w-full bg-[#43C17A]" />
      
      <View className="p-5 md:p-6 flex-col md:flex-row items-start md:items-center">
        <View className="flex-row md:flex-col items-center w-full md:w-auto md:mr-8 md:border-r border-gray-100 md:pr-8 mb-6 md:mb-0">
          <View className="mr-4 md:mr-0 md:mb-4 rounded-full bg-white p-[2px] border border-gray-100 shadow-sm">
            {profile.image ?
            <Image
              source={{ uri: profile.image }}
              className="w-[72px] h-[72px] rounded-full"
              resizeMode="cover" /> :


            <DefaultAvatar />
            }
          </View>
          <View className="flex-1 md:items-center">
             <Text className="text-[#1F2937] text-[18px] md:text-center" style={{ fontFamily: fonts.bold }}>
               {profile.name}
             </Text>
             <View className="bg-[#43C17A]/10 px-2.5 py-1 rounded-md mt-1.5 self-start md:self-center">
               <Text className="text-[#43C17A] text-[10px] uppercase tracking-widest" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Faculty", "Faculty")}

              </Text>
             </View>
          </View>
        </View>

        <View className="flex-1 flex-row flex-wrap w-full md:pl-2">
          <InfoRow icon={IdentificationCard} label={t("Auto.Attr.FacultyID", "Faculty ID")} value={!loading ? profile.facultyId : "..."} />
          <InfoRow icon={Buildings} label={isInter ? "Group" : "Branch"} value={profile.branch} />
          <InfoRow icon={Phone} label={t("Auto.Attr.Mobile", "Mobile")} value={profile.mobile} />
          <InfoRow icon={Envelope} label={t("Auto.Common.Email", "Email")} value={profile.email} />
          <InfoRow icon={CalendarBlank} label={t("Auto.Attr.DateofJoining", "Date of Joining")} value={profile.joiningDate} />
          <InfoRow icon={Briefcase} label={t("Auto.Attr.Experience", "Experience")} value={profile.experience} />
        </View>
      </View>
    </View>);

};

export default FacultyInfoCard;
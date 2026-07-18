import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { FC } from "react";
import { View } from 'react-native';
import { AnalyticsFacultyProfile } from "../types";
import { fonts } from "@/constants/fonts";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";

interface Props {
  profile: AnalyticsFacultyProfile;
}

const AnalyticsFacultyInfo: FC<Props> = ({ profile }) => {const { t } = useTranslation();
  const isInter = profile.collegeEducationType === "Inter";
  const isSchool = isSchoolEducation(profile.collegeEducationType);

  return (
    <View className="w-full mb-5 px-1">
      <Text className="text-[#282828] text-[17px] mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.FacultyInformat", "Faculty Information")}

      </Text>

      <View className="flex-row flex-wrap w-full">
        <View className="w-1/2 md:w-1/3 mb-3 pr-2">
          <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Name", "Name :")}</Text>
          <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.name}</Text>
        </View>

        {!isSchool && (
          <View className="w-1/2 md:w-1/3 mb-3 pl-2 md:pl-0 pr-2">
            <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{isInter ? "Group" : "Branch"} :</Text>
            <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.department}</Text>
          </View>
        )}

        <View className="w-1/2 md:w-1/3 mb-3 pr-2 md:pr-0">
          <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.EmployeeID", "Employee ID :")}</Text>
          <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.employeeId}</Text>
        </View>

        <View className="w-1/2 md:w-1/3 mb-3 pl-2 md:pl-0 pr-2">
          <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.Experience", "Experience :")}</Text>
          <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.experience}</Text>
        </View>

        <View className="w-1/2 md:w-1/3 mb-3 pr-2 md:pr-0">
          <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.LeavesTaken", "Leaves Taken:")}</Text>
          <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.leavesTaken}</Text>
        </View>

        <View className="w-1/2 md:w-1/3 mb-3 pl-2 md:pl-0">
          <Text className="text-[#282828] text-[14px]" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.WorkingDays", "Working Days :")}</Text>
          <Text className="text-[#525252] text-[14px] mt-0.5" style={{ fontFamily: fonts.regular }}>{profile.workingDays}</Text>
        </View>
      </View>
    </View>);

};

export default AnalyticsFacultyInfo;
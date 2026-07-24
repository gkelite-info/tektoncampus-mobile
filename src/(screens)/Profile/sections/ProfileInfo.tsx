import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { User, Image as ImageIcon } from "phosphor-react-native";
import { useUser } from "@/utils/context/UserContext";
import ImageUploadModal from "@/components/modals/ImageUploadModal";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";

type ProfileInfoProps = {
  onNext: () => void;
};

export default function ProfileInfo({ onNext }: ProfileInfoProps) {const { t } = useTranslation();
  const {
    fullName,
    email,
    mobile,
    collegeEducationType,
    collegeBranchCode,
    collegeAcademicYear,
    collegeSection,
    profilePhoto,
    identifierId,
    userId,
    role,
    setProfilePhoto
  } = useUser();

  const isSchool = isSchoolEducation(collegeEducationType);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const isStudentOrFaculty = ["Student", "Faculty"].includes(role || "");
  const registrationId = identifierId || userId;

  const ProfileRow = ({ label, value }: {label: string;value?: string | null;}) =>
  <View className="flex-row items-center py-3 border-b border-gray-100">
            <Text className="w-[120px] text-gray-500 text-sm" style={{ fontFamily: fonts.medium }}>{label}</Text>
            <Text className="flex-1 text-gray-800 text-sm" style={{ fontFamily: fonts.medium }}>{value || "—"}</Text>
        </View>;


  if (isLoading) {
    return (
      <View className="flex-1 bg-white rounded-xl p-4  items-center justify-center">
                <ActivityIndicator size="large" color="#43C17A" />
                <Text className="text-gray-400 mt-2" style={{ fontFamily: fonts.regular }}>{t("Auto.Common.Loadingprofile", "Loading profile...")}</Text>
            </View>);

  }

  return (
    <View className="flex-1 bg-white rounded-xl  overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                <Text className="text-xl text-gray-900" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Profile", "Profile")}</Text>
                <TouchableOpacity
          onPress={onNext}
          className="bg-[#43C17A] px-6 py-2 rounded-lg">
          
                    <Text className="text-white" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.Next", "Next")}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                {}
                <View className="items-center mb-8">
                    <View className="w-32 h-32 rounded-full border-4 border-[#43C17A] bg-gray-100 items-center justify-center overflow-hidden mb-4 ">
                        {profilePhoto ?
            <Image
              source={{ uri: profilePhoto }}
              className="w-full h-full"
              resizeMode="cover" /> :


            <User size={64} color="#9ca3af" weight="fill" />
            }
                    </View>

                    <TouchableOpacity
            onPress={() => setIsUploadModalOpen(true)}
            className="bg-[#16284F] flex-row items-center px-4 py-2.5 rounded-lg gap-2">
            
                        <View className="bg-white p-1 rounded-full">
                            <ImageIcon size={16} weight="bold" color="#16284F" />
                        </View>
                        <Text className="text-white text-sm" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.UploadPhoto", "Upload Photo")}</Text>
                    </TouchableOpacity>
                </View>

                {}
                <View className="px-2">
                    <Text className="text-2xl text-[#1B2B5B] mb-6" style={{ fontFamily: fonts.bold }}>{fullName}</Text>

                    <View className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <ProfileRow label={t("Auto.Attr.RegistrationID", "Registration ID")} value={String(registrationId)} />
                        <ProfileRow label={t("Auto.Common.Email", "Email")} value={email} />
                        <ProfileRow label={t("Auto.Attr.Phone", "Phone")} value={mobile} />
                        <ProfileRow label={t("Auto.Common.EducationType", "Education Type")} value={collegeEducationType} />
                        
                        {isStudentOrFaculty &&
            <>
                                {!isSchool && <ProfileRow label={t("Auto.Common.Branch", "Branch")} value={collegeBranchCode} />}
                                <ProfileRow label={isSchool ? t("Auto.Attr.CurrentClass", "Current Class") : t("Auto.Attr.CurrentYear", "Current Year")} value={collegeAcademicYear} />
                                <ProfileRow label={t("Auto.Attr.Section", "Section")} value={collegeSection} />
                            </>
            }
                    </View>
                </View>
            </ScrollView>

            <ImageUploadModal
        visible={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        userId={userId as number}
        onUploadSuccess={(url) => setProfilePhoto(url)} />
      
        </View>);

}
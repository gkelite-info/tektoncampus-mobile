import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useEffect, useState } from "react";
import { View, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useUser } from "@/utils/context/UserContext";
import { fetchStaffOnboardingSummary } from "@/lib/helpers/faculty/myAttendance/payroll/onboardingSummaryAPI";
import { fonts } from "@/constants/fonts";

const InfoRow = ({ label, value }: {label: string;value: string | number | null;}) =>
<View className="flex-row items-start py-2 w-full">
    <Text className="w-[140px] text-[14px] text-[#333333]" style={{ fontFamily: fonts.semiBold }}>
      {label}
    </Text>
    <Text
    className={`flex-1 text-[14px] ${value && value !== "Not Provided" ? "text-[#666666]" : "text-gray-400 italic"}`}
    style={{ fontFamily: value && value !== "Not Provided" ? fonts.regular : fonts.italic }}>
    
      {value || "Not Provided"}
    </Text>
  </View>;


const SummaryShimmer = () =>
<View className="w-full flex-col px-2">
    {[...Array(4)].map((_, i) =>
  <View key={i} className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        {i === 0 ?
    <View className="items-center mb-6 mt-2">
            <View className="w-[84px] h-[84px] rounded-full bg-gray-200 mb-3" />
            <View className="h-5 w-32 bg-gray-200 rounded" />
          </View> :

    <View className="h-5 w-40 bg-gray-200 rounded mb-6" />
    }
        <View className="flex-col space-y-3 mt-4">
          {[...Array(5)].map((_, j) =>
      <View key={j} className="flex-row py-1">
              <View className="w-[140px] h-4 bg-gray-100 rounded" />
              <View className="flex-1 h-4 bg-gray-200 rounded ml-2" />
            </View>
      )}
        </View>
      </View>
  )}
  </View>;


export default function SummaryPage() {const { t } = useTranslation();
  const {
    userId,
    profilePhoto,
    dateOfJoining,
    professionalExperienceYears,
    identifierId,
    role,
    fullName,
    collegeBranchCode,
    mobile,
    email
  } = useUser();

  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setIsLoading(true);
      const data = await fetchStaffOnboardingSummary(Number(userId));
      setOnboardingData(data);
      setIsLoading(false);
    };
    loadData();
  }, [userId]);

  if (!role || !userId) return null;
  if (isLoading) return <SummaryShimmer />;

  const { bank, aadhaar, pan } = onboardingData || {};

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not Provided";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const isInter = ["Inter"].includes(role);
  const systemId = identifierId ? `ID-${identifierId}` : `ID-${userId}`;

  return (
    <View className="w-full flex-col max-md:px-2">
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        <View className="items-center mb-6 mt-2">
          {profilePhoto ?
          <Image
            source={{ uri: profilePhoto }}
            className="w-[84px] h-[84px] rounded-full mb-3" /> :


          <View className="w-[84px] h-[84px] rounded-full bg-gray-200 items-center justify-center mb-3">
              <Text className="text-gray-400 text-xl font-bold">{fullName?.charAt(0) || "U"}</Text>
            </View>
          }
          <Text className="text-[17px] text-gray-800 text-center mt-3" style={{ fontFamily: fonts.bold }}>
            {fullName}
          </Text>
          <View className="bg-[#43C17A]/10 px-2 py-0.5 rounded mt-1">
            <Text className="text-xs text-[#43C17A]" style={{ fontFamily: fonts.semiBold }}>
              {role}
            </Text>
          </View>
        </View>
        
        <View className="flex-col">
          <InfoRow label={`${role} ID`} value={systemId} />
          <InfoRow label={isInter ? "Group" : "Branch"} value={collegeBranchCode} />
          <InfoRow label={t("Auto.Attr.Mobile", "Mobile")} value={mobile} />
          <InfoRow label={t("Auto.Common.Email", "Email")} value={email} />
          <InfoRow label={t("Auto.Attr.DateofJoining", "Date of Joining")} value={formatDate(dateOfJoining)} />
          <InfoRow
            label={t("Auto.Attr.Experience", "Experience")}
            value={professionalExperienceYears ? `${professionalExperienceYears} Years` : null} />
          
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        <View className="border-b border-gray-100 pb-4 mb-4">
          <Text className="text-[16px] text-gray-800" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.PaymentInformat", "Payment Information")}

          </Text>
        </View>

        <View className="mb-5">
          <InfoRow
            label={t("Auto.Attr.SalaryPaymentMo", "Salary Payment Mode:")}
            value={bank ? "Bank Transfer" : "Not Provided"} />
          
        </View>

        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[15px] text-gray-800" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.BankInformation", "Bank Information")}

          </Text>
          {!bank &&
          <View className="bg-red-100 px-2 py-0.5 rounded-[4px]">
              <Text className="text-red-600 text-[10px] tracking-wide" style={{ fontFamily: fonts.semiBold }}>{t("Auto.Common.ActionRequired", "Action Required")}

            </Text>
            </View>
          }
        </View>

        <View className="flex-col">
          <InfoRow label={t("Auto.Attr.BankName", "Bank Name:")} value={bank?.bankName} />
          <InfoRow label={t("Auto.Attr.AccountNumber", "Account Number:")} value={bank?.accountNumber} />
          <InfoRow label={t("Auto.Attr.IFSCCode", "IFSC Code:")} value={bank?.ifscCode} />
          <InfoRow label={t("Auto.Attr.NameonAccount", "Name on Account:")} value={bank?.accountHolderName} />
          <InfoRow label={t("Auto.Attr.Branch", "Branch:")} value={bank?.branch} />
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        <Text className="text-[16px] text-gray-800 mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.IdentityInforma", "Identity Information")}

        </Text>

        <View className="flex-row items-center mb-5">
          <Image
            source={require("../../../../../../assets/india.png")}
            className="h-[14px] w-[20px] rounded-[1px] mr-2"
            resizeMode="contain" />
          
          <Text className="text-[16px] text-gray-800" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.AadhaarCard", "Aadhaar Card")}

          </Text>
        </View>

        <View className="flex-col">
          <InfoRow label={t("Auto.Attr.AadhaarNumber", "Aadhaar Number:")} value={aadhaar?.aadhaarNumber} />
          <InfoRow label={t("Auto.Attr.DateofBirth", "Date of Birth:")} value={formatDate(aadhaar?.dateOfBirth)} />
          <InfoRow label={t("Auto.Attr.Address", "Address:")} value={aadhaar?.address} />
          <InfoRow label={t("Auto.Attr.EnrollmentNumbe", "Enrollment Number:")} value={aadhaar?.enrollmentNumber} />
          <InfoRow label={t("Auto.Attr.NameonAadhaar", "Name on Aadhaar:")} value={aadhaar?.nameOnAadhaar} />
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center mb-5 mt-1">
          <Image
            source={require("../../../../../../assets/india.png")}
            className="h-[14px] w-[20px] rounded-[1px] mr-2"
            resizeMode="contain" />
          
          <Text className="text-[16px] text-gray-800" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.PANCard", "PAN Card")}

          </Text>
        </View>

        <View className="flex-col mt-2">
          <InfoRow label={t("Auto.Attr.PermanentAccoun", "Permanent Account Number:")} value={pan?.panNumber} />
          <InfoRow label={t("Auto.Attr.DateofBirth", "Date of Birth:")} value={formatDate(pan?.dateOfBirth)} />
          <InfoRow label={t("Auto.Attr.NameonPAN", "Name on PAN:")} value={pan?.nameOnPan} />
          <InfoRow label={t("Auto.Attr.FathersName", "Father's Name:")} value={pan?.fatherName} />
        </View>
      </View>
    </View>);

}
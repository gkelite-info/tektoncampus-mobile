import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React from "react";
import { View, Modal, TouchableOpacity, ScrollView, Image, Linking, SafeAreaView } from 'react-native';
import { X } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import { SharedPlacementCompany } from "../types/sharedPlacement.types";
import { formatDisplayDate, getWebsiteHref, getAttachmentName } from "../utils/placementFormatters";
import { useTranslations } from "@/utils/useTranslations";
interface SharedPlacementModalProps {
  company: SharedPlacementCompany;
  role: "student" | "faculty";
  visible: boolean;
  onClose: () => void;
}
const DetailRow = ({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) => <View className="flex-row mb-4">
        <Text className="w-[120px] text-slate-500 text-sm" style={{
    fontFamily: fonts.medium
  }}>{label}</Text>
        <View className="flex-1">
            {typeof children === "string" ? <Text className="text-[#1E293B] text-sm leading-5" style={{
      fontFamily: fonts.regular
    }}>
                    {children}
                </Text> : children}
        </View>
    </View>;
export default function SharedPlacementModal({
  company,
  role,
  visible,
  onClose
}: SharedPlacementModalProps) {
  const {
    t
  } = useTranslation();
  const isStudent = role === "student";
  const websiteHref = getWebsiteHref(company.website);
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };
  return <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View className="flex-1 bg-black/40 justify-end">
                <View className="bg-white rounded-t-3xl h-[85%]">
                    <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                        <Text className="text-xl text-[#1E293B]" style={{
            fontFamily: fonts.bold
          }}>
                            {t("Company Details")}
                        </Text>
                        <TouchableOpacity onPress={onClose} className="p-2 bg-slate-50 rounded-full">
                            <X size={20} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="p-5" showsVerticalScrollIndicator={false} contentContainerStyle={{
          paddingBottom: 40
        }}>
                        <View className="flex-row items-center mb-6">
                            <View className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 items-center justify-center mr-4 p-2 overflow-hidden">
                                {company.logo ? <Image source={{
                uri: company.logo
              }} style={{
                width: '100%',
                height: '100%'
              }} resizeMode="contain" /> : <Text className="text-slate-400 font-bold">{company.name.charAt(0)}</Text>}
                            </View>
                            <View className="flex-1">
                                <Text className="text-lg text-[#1E293B]" style={{
                fontFamily: fonts.bold
              }}>
                                    {company.name}
                                </Text>
                                <Text className="text-slate-500 mt-1" style={{
                fontFamily: fonts.medium
              }}>
                                    {company.role || t("Multiple Roles")}
                                </Text>
                            </View>
                        </View>

                        <DetailRow label={t("Description")}>
                            {company.longDescription || t("No description provided")}
                        </DetailRow>
                        
                        <DetailRow label={t("Email")}>{company.email || "-"}</DetailRow>
                        <DetailRow label={t("Contact No.")}>{company.phone || "-"}</DetailRow>
                        
                        <DetailRow label={t("Website")}>
                            {websiteHref ? <TouchableOpacity onPress={() => handleOpenLink(websiteHref)}>
                                    <Text className="text-[#43C17A] underline" style={{
                fontFamily: fonts.medium
              }}>
                                        {company.website}
                                    </Text>
                                </TouchableOpacity> : "-"}
                        </DetailRow>

                        <DetailRow label={t("Required Skills")}>
                            {company.skills?.join(", ") || "-"}
                        </DetailRow>
                        
                        <DetailRow label={t("Roles Offered")}>{company.role || "-"}</DetailRow>
                        <DetailRow label={t("Package Details")}>{company.packageDetails || "-"}</DetailRow>
                        <DetailRow label={t("Drive Type")}>{company.driveType || "-"}</DetailRow>
                        <DetailRow label={t("Work Mode")}>{company.workMode || "-"}</DetailRow>
                        <DetailRow label={t("Start Date")}>{formatDisplayDate(company.startDate)}</DetailRow>
                        <DetailRow label={t("End Date")}>{formatDisplayDate(company.endDate)}</DetailRow>
                        <DetailRow label={t("Status")}>{company.isExpired ? t("Completed") : t("Open")}</DetailRow>
                        <DetailRow label={t("Criteria")}>{company.eligibilityCriteria || "-"}</DetailRow>

                        {/* Role specific fields */}
                        {isStudent ? <DetailRow label={t("Eligibility")}>{company.isEligible ? t("Eligible") : t("Not eligible")}</DetailRow> : <DetailRow label={t("Education Type")}>{company.educationTypeName || company.collegeEducationId || "-"}</DetailRow>}

                        <DetailRow label={t("Branch Name")}>{company.branchName || company.collegeBranchId || "-"}</DetailRow>
                        <DetailRow label={t("Academic Year")}>{company.academicYear || company.collegeAcademicYearId || "-"}</DetailRow>
                        <DetailRow label={t("Job Type")}>{company.jobType || "-"}</DetailRow>
                        <DetailRow label={t("Location(s)")}>{company.location || "-"}</DetailRow>

                        <DetailRow label={t("Documents")}>
                            <View className="flex-row flex-wrap">
                                {company.attachments?.length > 0 ? company.attachments.map((attachment, idx) => <TouchableOpacity key={idx} onPress={() => handleOpenLink(attachment)} className="bg-emerald-50 px-3 py-1.5 rounded-full mr-2 mb-2">
                                            <Text className="text-[#43C17A] text-xs" style={{
                  fontFamily: fonts.semiBold
                }}>
                                                {getAttachmentName(attachment)}
                                            </Text>
                                        </TouchableOpacity>) : "-"}
                            </View>
                        </DetailRow>
                    </ScrollView>
                </View>
            </View>
        </Modal>;
}
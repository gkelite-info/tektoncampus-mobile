import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';import { Text } from '@/components/AppText';
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from "react-native-toast-message";
import { Trash } from "phosphor-react-native";
import { useStudent } from "@/utils/context/student/useStudent";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";

interface SharedProps {
  data: any;
  onSave: (payload: any) => Promise<void>;
  onDelete?: () => Promise<void>;
  userId: number;
}

export function PrimaryEducationForm({ data, onSave, userId }: SharedProps) {const { t } = useTranslation();
  const [schoolName, setSchoolName] = useState(data?.schoolName || "");
  const [board, setBoard] = useState(data?.board || "");
  const [mediumOfStudy, setMediumOfStudy] = useState(data?.mediumOfStudy || "");
  const [yearOfPassing, setYearOfPassing] = useState(data?.yearOfPassing ? String(data.yearOfPassing) : "");
  const [location, setLocation] = useState(data?.location || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!schoolName) return Toast.show({ type: "error", text1: "School name is required" });
    if (!yearOfPassing) return Toast.show({ type: "error", text1: "Year of passing is required" });

    setIsLoading(true);
    try {
      await onSave({
        primaryEducationId: data?.primaryEducationId,
        userId,
        schoolName,
        board,
        mediumOfStudy,
        yearOfPassing: Number(yearOfPassing),
        location
      });
      Toast.show({ type: "success", text1: "Saved successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to save" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
            <Text className="text-[#43C17A] text-lg mb-4" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.PrimaryEducatio", "Primary Education")}</Text>
            
            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.SchoolName", "School Name*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={schoolName} onChangeText={setSchoolName} placeholder={t("Auto.Attr.EnterSchoolName", "Enter School Name")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Board", "Board")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={board} onChangeText={setBoard} placeholder={t("Auto.Attr.egCBSEStateBoar", "e.g. CBSE, State Board")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.MediumofStudy", "Medium of Study")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={mediumOfStudy} onChangeText={setMediumOfStudy} placeholder={t("Auto.Attr.egEnglish", "e.g. English")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.YearofPassing", "Year of Passing*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={yearOfPassing} onChangeText={setYearOfPassing} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Location", "Location")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-4" value={location} onChangeText={setLocation} placeholder={t("Auto.Attr.CityState", "City, State")} />

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading} className="bg-[#43C17A] py-2 rounded-md items-center">
                <Text className="text-white" style={{ fontFamily: fonts.bold }}>{isLoading ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.SavePrimaryEducation", "Save Primary Education")}</Text>
            </TouchableOpacity>
        </View>);

}

export function SecondaryEducationForm({ data, onSave, onDelete, userId }: SharedProps) {const { t } = useTranslation();
  const [institutionName, setInstitutionName] = useState(data?.institutionName || "");
  const [board, setBoard] = useState(data?.board || "");
  const [mediumOfStudy, setMediumOfStudy] = useState(data?.mediumOfStudy || "");
  const [yearOfPassing, setYearOfPassing] = useState(data?.yearOfPassing ? String(data.yearOfPassing) : "");
  const [percentage, setPercentage] = useState(data?.percentage ? String(data.percentage) : "");
  const [location, setLocation] = useState(data?.location || "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!institutionName || !yearOfPassing || !percentage) return Toast.show({ type: "error", text1: "Please fill required fields" });

    setIsLoading(true);
    try {
      await onSave({
        secondaryEducationId: data?.secondaryEducationId,
        userId,
        institutionName,
        board,
        mediumOfStudy,
        yearOfPassing: Number(yearOfPassing),
        percentage: Number(percentage),
        location
      });
      Toast.show({ type: "success", text1: "Saved successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to save" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#43C17A] text-lg" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.SecondaryEducat", "Secondary Education")}</Text>
                {onDelete &&
        <TouchableOpacity onPress={onDelete} className="p-2">
                        <Trash size={20} color="#ef4444" />
                    </TouchableOpacity>
        }
            </View>
            
            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.InstitutionName", "Institution Name*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={institutionName} onChangeText={setInstitutionName} placeholder={t("Auto.Attr.EnterInstitutio", "Enter Institution Name")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Board", "Board")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={board} onChangeText={setBoard} placeholder={t("Auto.Attr.egCBSEStateBoar", "e.g. CBSE, State Board")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.YearofPassing", "Year of Passing*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={yearOfPassing} onChangeText={setYearOfPassing} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.PercentageCGPA", "Percentage/CGPA*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-4" value={percentage} onChangeText={setPercentage} placeholder={t("Auto.Attr.eg855", "e.g. 85.5")} keyboardType="numeric" />

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading} className="bg-[#43C17A] py-2 rounded-md items-center">
                <Text className="text-white" style={{ fontFamily: fonts.bold }}>{isLoading ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.SaveSecondaryEducation", "Save Secondary Education")}</Text>
            </TouchableOpacity>
        </View>);

}

export function UndergraduateEducationForm({ data, onSave, onDelete, userId }: SharedProps) {const { t } = useTranslation();
  const { collegeEducationType } = useStudent();
  const isSchool = isSchoolEducation(collegeEducationType);
  const [collegeName, setCollegeName] = useState(data?.collegeName || "");
  const [courseName, setCourseName] = useState(data?.courseName || "");
  const [specialization, setSpecialization] = useState(data?.specialization || "");
  const [startYear, setStartYear] = useState(data?.startYear ? String(data.startYear) : "");
  const [endYear, setEndYear] = useState(data?.endYear ? String(data.endYear) : "");
  const [cgpa, setCgpa] = useState(data?.CGPA ? String(data.CGPA) : "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!collegeName || !courseName || !startYear) return Toast.show({ type: "error", text1: "Please fill required fields" });

    setIsLoading(true);
    try {
      await onSave({
        undergraduateEducationId: data?.undergraduateEducationId,
        userId,
        collegeName,
        courseName,
        specialization,
        startYear: Number(startYear),
        endYear: endYear ? Number(endYear) : null,
        CGPA: cgpa ? Number(cgpa) : null
      });
      Toast.show({ type: "success", text1: "Saved successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to save" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#43C17A] text-lg" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.UndergraduateEd", "Undergraduate Education")}</Text>
                {onDelete &&
        <TouchableOpacity onPress={onDelete} className="p-2">
                        <Trash size={20} color="#ef4444" />
                    </TouchableOpacity>
        }
            </View>
            
            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{isSchool ? t("Auto.Common.SchoolName", "School Name*") : t("Auto.Common.CollegeUniversi", "College/University Name*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={collegeName} onChangeText={setCollegeName} placeholder={isSchool ? t("Auto.Attr.EnterSchoolNam", "Enter School Name") : t("Auto.Attr.EnterCollegeNam", "Enter College Name")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CourseName", "Course Name*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={courseName} onChangeText={setCourseName} placeholder={t("Auto.Attr.egBTechBSc", "e.g. B.Tech, B.Sc")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.Specialization", "Specialization")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={specialization} onChangeText={setSpecialization} placeholder={t("Auto.Attr.egComputerScien", "e.g. Computer Science")} />

            <View className="flex-row gap-3 mb-3">
                <View className="flex-1">
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.StartYear", "Start Year*")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2" value={startYear} onChangeText={setStartYear} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />
                </View>
                <View className="flex-1">
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EndYear", "End Year")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2" value={endYear} onChangeText={setEndYear} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />
                </View>
            </View>

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.CGPA", "CGPA")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-4" value={cgpa} onChangeText={setCgpa} placeholder={t("Auto.Attr.eg85", "e.g. 8.5")} keyboardType="numeric" />

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading} className="bg-[#43C17A] py-2 rounded-md items-center">
                <Text className="text-white" style={{ fontFamily: fonts.bold }}>{isLoading ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.SaveUndergraduateEducation", "Save Undergraduate Education")}</Text>
            </TouchableOpacity>
        </View>);

}

export function PhdEducationForm({ data, onSave, onDelete, userId }: SharedProps) {const { t } = useTranslation();
  const [universityName, setUniversityName] = useState(data?.universityName || "");
  const [researchArea, setResearchArea] = useState(data?.researchArea || "");
  const [supervisorName, setSupervisorName] = useState(data?.supervisorName || "");
  const [startYear, setStartYear] = useState(data?.startYear ? String(data.startYear) : "");
  const [endYear, setEndYear] = useState(data?.endYear ? String(data.endYear) : "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!universityName || !researchArea || !startYear) return Toast.show({ type: "error", text1: "Please fill required fields" });

    setIsLoading(true);
    try {
      await onSave({
        phdeducationId: data?.phdeducationId,
        userId,
        universityName,
        researchArea,
        supervisorName,
        startYear: Number(startYear),
        endYear: endYear ? Number(endYear) : null
      });
      Toast.show({ type: "success", text1: "Saved successfully" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to save" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-[#43C17A] text-lg" style={{ fontFamily: fonts.bold }}>{t("Auto.Common.PhDEducation", "PhD Education")}</Text>
                {onDelete &&
        <TouchableOpacity onPress={onDelete} className="p-2">
                        <Trash size={20} color="#ef4444" />
                    </TouchableOpacity>
        }
            </View>
            
            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.UniversityName", "University Name*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={universityName} onChangeText={setUniversityName} placeholder={t("Auto.Attr.EnterUniversity", "Enter University Name")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.ResearchArea", "Research Area*")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={researchArea} onChangeText={setResearchArea} placeholder={t("Auto.Attr.egArtificialInt", "e.g. Artificial Intelligence")} />

            <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.SupervisorName", "Supervisor Name")}</Text>
            <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2 mb-3" value={supervisorName} onChangeText={setSupervisorName} placeholder={t("Auto.Attr.EnterSupervisor", "Enter Supervisor Name")} />

            <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.StartYear", "Start Year*")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2" value={startYear} onChangeText={setStartYear} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />
                </View>
                <View className="flex-1">
                    <Text className="text-sm text-[#282828] mb-1" style={{ fontFamily: fonts.medium }}>{t("Auto.Common.EndYear", "End Year")}</Text>
                    <TextInput className="border border-[#CCCCCC] rounded-md px-3 py-2" value={endYear} onChangeText={setEndYear} placeholder={t("Auto.Attr.YYYY", "YYYY")} keyboardType="numeric" maxLength={4} />
                </View>
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={isLoading} className="bg-[#43C17A] py-2 rounded-md items-center">
                <Text className="text-white" style={{ fontFamily: fonts.bold }}>{isLoading ? t("Dashboard.profile.Saving", "Saving...") : t("Dashboard.profile.SavePhDEducation", "Save PhD Education")}</Text>
            </TouchableOpacity>
        </View>);

}
import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/AppText';
import React from "react";
import { View, TouchableOpacity, ScrollView, Linking, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { ProjectCardProps } from "@/lib/types/project";
import tw from "twrnc";
import { CaretLeft } from "phosphor-react-native";
import { Avatar } from "@/components/Avatar";
import { useUser } from "@/utils/context/UserContext";
import { isSchoolEducation } from "@/lib/helpers/admin/academicSetup/schoolHelper";
type ProjectCardListProps = {
  data: ProjectCardProps[];
  onViewDetails: (project: ProjectCardProps) => void;
  role?: string;
};
const MemberAvatar = ({
  image,
  name,
  index
}: {
  image?: string | null;
  name?: string;
  index: number;
}) => {
  return <View style={[tw`rounded-full border-2 border-white bg-gray-200`, index > 0 && tw`-ml-3`]}>
    <Avatar src={image} size={36} />
  </View>;
};
export const ProjectCard = ({
  data,
  onViewDetails,
  role
}: ProjectCardListProps) => {
  const {
    t
  } = useTranslation();
  return <View style={tw`flex-col gap-6`}>
    {data.map((project, index) => {

      return <View key={index} style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4`}>

        <View style={tw`flex-row justify-between items-start gap-3 mb-3`}>
          <View style={tw`flex-1`}>
            <Text style={[{ fontFamily: fonts.bold }, tw`text-lg text-[#1f2933]`]}>{project.title}</Text>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-sm text-[#4b5563] mt-1`]} numberOfLines={2}>
              {project.description}
            </Text>
          </View>
          <TouchableOpacity style={tw`rounded-full bg-[#22c55e] px-4 py-2`} onPress={() => onViewDetails(project)}>

            <Text style={[{ fontFamily: fonts.semiBold }, tw`text-xs text-white`]}>{t("Auto.Common.ViewDetails", "View Details")}</Text>
          </TouchableOpacity>
        </View>

        <View style={tw`flex-col gap-3 mt-3`}>
          <View style={tw`flex-row items-center`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw` text-[#111827] w-28 text-sm`]}>{t("Auto.Common.Duration", "Duration")}</Text>
            <View style={tw`px-3 py-1 rounded-full bg-[#EFE8FF]`}>
              <Text style={[{ fontFamily: fonts.medium }, tw`text-[#5B4FE1] text-xs`]}>{project.duration}</Text>
            </View>
          </View>

          <View style={tw`flex-row items-center`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw` text-[#111827] w-28 text-sm`]}>{t("Auto.Common.TechStack", "Tech Stack")}</Text>
            <Text style={[{ fontFamily: fonts.regular }, tw`text-sm text-[#374151] flex-1`]} numberOfLines={1}>{project.techStack}</Text>
          </View>

          <View style={tw`flex-row items-center`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw` text-[#111827] w-28 text-sm`]}>{t("Auto.Common.Team", "Team")}</Text>
            <View style={tw`flex-row items-center`}>
              {project.teamMembers.length > 0 ? project.teamMembers.slice(0, 4).map((member, i) => <MemberAvatar key={i} image={member.image} name={member.name} index={i} />) : <Text style={[{ fontFamily: fonts.italic }, tw`text-gray-400 text-xs`]}>{t("Auto.Common.Nomembers", "No members")}</Text>}
            </View>
          </View>

          <View style={tw`flex-row items-center`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw` text-[#111827] w-28 text-sm`]}>{t("Auto.Common.Mentor", "Mentor")}</Text>
            <View style={tw`flex-row items-center flex-wrap`}>
              {project.mentors.length > 0 ? project.mentors.map((mentor, i) => <MemberAvatar key={i} image={mentor.image} name={mentor.name} index={i} />) : <Text style={[{ fontFamily: fonts.italic }, tw`text-gray-400 text-xs`]}>{t("Auto.Common.Nomentor", "No mentor")}</Text>}
            </View>
          </View>

          <View style={tw`flex-row items-center`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw` text-[#111827] w-28 text-sm`]}>{t("Auto.Common.Marks", "Marks")}</Text>
            <Text style={[{ fontFamily: fonts.medium }, tw`text-sm text-[#374151]`]}>{project.marks}</Text>
          </View>
        </View>
      </View>;
    })}
  </View>;
};
type ProjectDetailsModalProps = {
  project: ProjectCardProps;
  visible: boolean;
  onClose: () => void;
  onViewSubmissions?: (project: ProjectCardProps) => void;
};
export const ProjectDetailsModal = ({
  project,
  visible,
  onClose,
  onViewSubmissions
}: ProjectDetailsModalProps) => {
  const {
    t
  } = useTranslation();
  const { collegeEducationType } = useUser();
  const isSchool = isSchoolEducation(collegeEducationType);
  const domains = (project.techStack || "").split(",").map(s => s.trim()).filter(Boolean);
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center justify-between p-6 pb-4 border-b border-gray-100`}>
        <TouchableOpacity onPress={onClose} style={tw`flex-row items-center gap-2`}>
          <CaretLeft size={22} color="#4b5563" />
          <Text style={[{ fontFamily: fonts.semiBold }, tw` text-lg text-gray-800`]}>{t("Auto.Common.Details", "Details")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`bg-[#16284F] rounded-lg px-4 py-2`} onPress={() => {
          if (project.projectId !== null && onViewSubmissions) {
            onViewSubmissions(project);
          }
        }}>

          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-white text-sm`]}>{t("Auto.Common.Submissions", "Submissions")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={tw`flex-1 px-6 pt-4 pb-6`}>
        <Text style={[{ fontFamily: fonts.semiBold }, tw`text-2xl text-[#16a34a] mb-6`]}>{project.title}</Text>

        <View style={tw`mb-5`}>
          <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>{t("Auto.Common.Description", "Description")}</Text>
          <Text style={tw`text-base text-gray-700 leading-relaxed`}>{project.description || t("FacultyProjects.noDescriptionProvided", "No description provided.")}</Text>
        </View>

        {!isSchool && (
          <View style={tw`mb-5`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Common.Domains", "Domain(s)")}</Text>
            <View style={tw`flex-row flex-wrap gap-2`}>
              {domains.length > 0 ? domains.map((d, i) => <View key={i} style={tw`px-3 py-1.5 rounded-full bg-[#16284F21]`}>
                <Text style={[{ fontFamily: fonts.medium }, tw`text-[#16284F] text-sm`]}>{d}</Text>
              </View>) : <Text style={[{ fontFamily: fonts.italic }, tw`text-gray-400 text-sm`]}>{t("Auto.Common.Nodomainsspecif", "No domains specified")}</Text>}
            </View>
          </View>
        )}

        <View style={tw`mb-5`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Common.Duration", "Duration")}</Text>
          <View style={tw`self-start px-4 py-1.5 rounded-full bg-[#EFE8FF]`}>
            <Text style={[{ fontFamily: fonts.medium }, tw`text-[#5B4FE1] text-sm`]}>{project.duration}</Text>
          </View>
        </View>

        <View style={tw`mb-5`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Attr.TeamMembers", "Team Members")}</Text>
          <View style={tw`flex-row items-center flex-wrap`}>
            {project.teamMembers.length > 0 ? project.teamMembers.map((member, i) => <MemberAvatar key={i} image={member.image} name={member.name} index={i} />) : <Text style={[{ fontFamily: fonts.italic }, tw`text-gray-400 text-sm`]}>{t("Auto.Common.Nomembersassign", "No members assigned")}</Text>}
          </View>
        </View>

        <View style={tw`mb-5`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Common.Mentors", "Mentor(s)")}</Text>
          <View style={tw`flex-col gap-3`}>
            {project.mentors.length > 0 ? project.mentors.map((mentor, i) => {

              return <View key={i} style={tw`flex-row items-center gap-3`}>
                <Avatar src={mentor.image} size={40} />
                <View>
                  <Text style={[{ fontFamily: fonts.semiBold }, tw`text-sm text-gray-900`]}>{mentor.name}</Text>
                  <Text style={[{ fontFamily: fonts.regular }, tw`text-xs text-gray-500`]}>{t("Auto.Common.FacultyGuide", "Faculty / Guide")}</Text>
                </View>
              </View>;
            }) : <Text style={[{ fontFamily: fonts.italic }, tw`text-gray-400 text-sm`]}>{t("Auto.Common.Nomentorassigne", "No mentor assigned")}</Text>}
          </View>
        </View>

        <View style={tw`mb-5`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Common.Marks", "Marks")}</Text>
          <View style={tw`self-start px-4 py-1.5 rounded-full bg-green-50`}>
            <Text style={[{ fontFamily: fonts.semiBold }, tw`text-green-700 text-sm`]}>{project.marks}{t("Auto.Common.pts", "pts")}</Text>
          </View>
        </View>

        <View style={tw`mb-6`}>
          <Text style={[{ fontFamily: fonts.semiBold }, tw`text-lg text-gray-900 mb-2`]}>{t("Auto.Common.Attachments", "Attachments")}</Text>
          {project.fileUrls.length > 0 ? project.fileUrls.map((url, i) => <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={tw`mb-2`}>
            <Text style={tw`text-blue-600 underline`}>{url.split("/").pop() || t("FacultyProjects.attachment", "Attachment")}</Text>
          </TouchableOpacity>) : <Text style={tw`text-gray-400 text-sm italic`}>{t("Auto.Common.Noattachmentsup", "No attachments uploaded")}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  </Modal>;
};
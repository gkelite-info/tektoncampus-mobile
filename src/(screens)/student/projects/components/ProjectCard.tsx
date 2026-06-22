import React from "react";
import { View, Image, TouchableOpacity, Linking, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/AppText";
import { User, Paperclip } from "phosphor-react-native";
import { fonts } from "@/constants/fonts";
import { Avatar } from "@/components/Avatar";

export type ProjectCardProps = {
  projectId?: number;
  collegeSubjectId?: number | null;
  title: string;
  description: string;
  duration: string;
  techStack: string;
  teamMembers: Array<{ name: string; image: string }>;
  mentors: Array<{ name: string; image: string }>;
  marks: number;
  fileUrls: string[];
  subject: string;
  status: string;
  endDate?: string;
};

type ProjectCardListProps = {
  data: ProjectCardProps[];
  onViewDetails: (project: ProjectCardProps) => void;
};

const MemberAvatar = ({
  image,
  name,
  index,
}: {
  image?: string | null;
  name?: string;
  index: number;
}) => {
  return (
    <View
      className={`rounded-full border-2 border-white bg-gray-200 ${
        index > 0 ? "-ml-3" : ""
      }`}
    >
      <Avatar src={image} size={36} />
    </View>
  );
};

export const ProjectCard = ({ data, onViewDetails }: ProjectCardListProps) => {
  const { t } = useTranslation();

  const handleOpenURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        t("Projects.student.Error", "Error"),
        t("Projects.student.CannotOpenURL", "Cannot open link: ") + url
      );
    }
  };

  return (
    <View className="flex-col gap-6">
      {data.map((project, index) => (
        <View
          key={index}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 mb-4"
        >
          {/* Header */}
          <View className="flex-row justify-between items-start mb-3 gap-3">
            <View className="flex-1">
              <Text
                className="text-lg font-bold text-[#1f2933]"
                style={{ fontFamily: fonts.bold }}
              >
                {project.title}
              </Text>
              <Text
                className="text-sm text-[#4b5563] mt-1"
                style={{ fontFamily: fonts.regular }}
                numberOfLines={2}
              >
                {project.description}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => onViewDetails(project)}
              className="bg-[#22c55e] px-4 py-2 rounded-full"
            >
              <Text
                className="text-white text-xs font-semibold"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.View Details")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View className="flex-col gap-3 mt-3">
            {/* Duration */}
            <View className="flex-row items-center">
              <Text
                className="w-28 text-sm font-semibold text-[#111827]"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Duration")}
              </Text>
              <View className="bg-[#EFE8FF] px-3 py-1 rounded-full">
                <Text
                  className="text-[#5B4FE1] text-xs font-medium"
                  style={{ fontFamily: fonts.medium }}
                >
                  {project.duration}
                </Text>
              </View>
            </View>

            {/* Tech Stack */}
            <View className="flex-row items-center">
              <Text
                className="w-28 text-sm font-semibold text-[#111827]"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Tech Stack")}
              </Text>
              <Text
                className="flex-1 text-sm text-[#374151]"
                style={{ fontFamily: fonts.regular }}
                numberOfLines={1}
              >
                {project.techStack}
              </Text>
            </View>

            {/* Team Members */}
            <View className="flex-row items-center">
              <Text
                className="w-28 text-sm font-semibold text-[#111827]"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Team Members")}
              </Text>
              <View className="flex-row items-center">
                {project.teamMembers && project.teamMembers.length > 0 ? (
                  project.teamMembers
                    .slice(0, 4)
                    .map((member, i) => (
                      <MemberAvatar
                        key={i}
                        image={member.image}
                        name={member.name}
                        index={i}
                      />
                    ))
                ) : (
                  <Text
                    className="text-gray-400 text-xs italic"
                    style={{ fontFamily: fonts.regular }}
                  >
                    {t("Projects.student.No members")}
                  </Text>
                )}
              </View>
            </View>

            {/* Mentor */}
            <View className="flex-row items-center">
              <Text
                className="w-28 text-sm font-semibold text-[#111827]"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Mentor")}
              </Text>
              <View className="flex-row items-center flex-wrap">
                {project.mentors && project.mentors.length > 0 ? (
                  project.mentors.map((mentor, i) => (
                    <MemberAvatar
                      key={i}
                      image={mentor.image}
                      name={mentor.name}
                      index={i}
                    />
                  ))
                ) : (
                  <Text
                    className="text-gray-400 text-xs italic"
                    style={{ fontFamily: fonts.regular }}
                  >
                    {t("Projects.student.No mentor")}
                  </Text>
                )}
              </View>
            </View>

            {/* Marks */}
            <View className="flex-row items-center">
              <Text
                className="w-28 text-sm font-semibold text-[#111827]"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Marks")}
              </Text>
              <Text
                className="text-sm text-[#374151] font-medium"
                style={{ fontFamily: fonts.medium }}
              >
                {project.marks}
              </Text>
            </View>

            {/* Attachments (Not in Faculty card index view, but keep it for student?) */}
            {/* The faculty index view doesn't have Attachments visible immediately, only in details modal. */}
            {/* But since student had it, maybe I should retain it? The request was to "port the UI of project card from there...". 
                I'll leave attachments since it's a student view and might be useful, but style it consistently.
             */}
            <View className="flex-row items-start mt-2">
              <Text
                className="w-28 text-sm font-semibold text-[#111827] mt-0.5"
                style={{ fontFamily: fonts.semiBold }}
              >
                {t("Projects.student.Attachments")}
              </Text>
              <View className="flex-1 flex-row flex-wrap gap-2">
                {project.fileUrls && project.fileUrls.length > 0 ? (
                  project.fileUrls.map((url, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleOpenURL(url)}
                      className="flex-row items-center bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1.5 gap-1 max-w-full"
                    >
                      <Paperclip size={12} color="#475569" />
                      <Text
                        className="text-[#4b5563] text-[10px] font-semibold flex-shrink truncate max-w-[150px]"
                        style={{ fontFamily: fonts.medium }}
                      >
                        {url.split("/").pop() || "Attachment"}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    className="text-gray-400 text-xs italic mt-0.5"
                    style={{ fontFamily: fonts.regular }}
                  >
                    {t("Projects.student.No attachments")}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

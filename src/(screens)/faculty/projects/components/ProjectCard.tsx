import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Linking, StyleSheet, Modal, SafeAreaView } from "react-native";
import { ProjectCardProps } from "@/lib/types/project";
import tw from "twrnc";
import { CaretLeft } from "phosphor-react-native";


import { Avatar } from "@/components/Avatar";

type ProjectCardListProps = {
    data: ProjectCardProps[];
    onViewDetails: (project: ProjectCardProps) => void;
    role?: string;
};

const MemberAvatar = ({ image, name, index }: { image?: string | null; name?: string; index: number }) => {
    return (
        <View style={[tw`rounded-full border-2 border-white bg-gray-200`, index > 0 && tw`-ml-3`]}>
            <Avatar src={image} size={36} />
        </View>
    );
};

export const ProjectCard = ({ data, onViewDetails, role }: ProjectCardListProps) => {
    return (
        <View style={tw`flex-col gap-6`}>
            {data.map((project, index) => (
                <View
                    key={index}
                    style={tw`bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4`}
                >
                    <View style={tw`flex-row justify-between items-start gap-3 mb-3`}>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-lg font-bold text-[#1f2933]`}>{project.title}</Text>
                            <Text style={tw`text-sm text-[#4b5563] mt-1`} numberOfLines={2}>
                                {project.description}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={tw`rounded-full bg-[#22c55e] px-4 py-2`}
                            onPress={() => onViewDetails(project)}
                        >
                            <Text style={tw`text-xs font-semibold text-white`}>View Details</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={tw`flex-col gap-3 mt-3`}>
                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-semibold text-[#111827] w-28 text-sm`}>Duration</Text>
                            <View style={tw`px-3 py-1 rounded-full bg-[#EFE8FF]`}>
                                <Text style={tw`text-[#5B4FE1] text-xs font-medium`}>{project.duration}</Text>
                            </View>
                        </View>

                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-semibold text-[#111827] w-28 text-sm`}>Tech Stack</Text>
                            <Text style={tw`text-sm text-[#374151] flex-1`} numberOfLines={1}>{project.techStack}</Text>
                        </View>

                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-semibold text-[#111827] w-28 text-sm`}>Team</Text>
                            <View style={tw`flex-row items-center`}>
                                {project.teamMembers.length > 0 ? (
                                    project.teamMembers.slice(0, 4).map((member, i) => (
                                        <MemberAvatar key={i} image={member.image} name={member.name} index={i} />
                                    ))
                                ) : (
                                    <Text style={tw`text-gray-400 text-xs italic`}>No members</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-semibold text-[#111827] w-28 text-sm`}>Mentor</Text>
                            <View style={tw`flex-row items-center flex-wrap`}>
                                {project.mentors.length > 0 ? (
                                    project.mentors.map((mentor, i) => (
                                        <MemberAvatar key={i} image={mentor.image} name={mentor.name} index={i} />
                                    ))
                                ) : (
                                    <Text style={tw`text-gray-400 text-xs italic`}>No mentor</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`flex-row items-center`}>
                            <Text style={tw`font-semibold text-[#111827] w-28 text-sm`}>Marks</Text>
                            <Text style={tw`text-sm text-[#374151] font-medium`}>{project.marks}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    );
};

type ProjectDetailsModalProps = {
    project: ProjectCardProps;
    visible: boolean;
    onClose: () => void;
    onViewSubmissions?: (project: ProjectCardProps) => void;
};

export const ProjectDetailsModal = ({ project, visible, onClose, onViewSubmissions }: ProjectDetailsModalProps) => {
    const domains = (project.techStack || "").split(",").map((s) => s.trim()).filter(Boolean);

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={tw`flex-1 bg-white`}>
                    <View style={tw`flex-row items-center justify-between p-6 pb-4 border-b border-gray-100`}>
                        <TouchableOpacity onPress={onClose} style={tw`flex-row items-center gap-2`}>
                            <CaretLeft size={22} color="#4b5563" />
                            <Text style={tw`font-semibold text-lg text-gray-800`}>Details</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`bg-[#16284F] rounded-lg px-4 py-2`}
                            onPress={() => {
                                if (project.projectId !== null && onViewSubmissions) {
                                    onViewSubmissions(project);
                                }
                            }}
                        >
                            <Text style={tw`text-white text-sm font-semibold`}>Submissions</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={tw`flex-1 px-6 pt-4 pb-6`}>
                        <Text style={tw`text-2xl font-semibold text-[#16a34a] mb-6`}>{project.title}</Text>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Description</Text>
                            <Text style={tw`text-base text-gray-700 leading-relaxed`}>{project.description || "No description provided."}</Text>
                        </View>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Domain(s)</Text>
                            <View style={tw`flex-row flex-wrap gap-2`}>
                                {domains.length > 0 ? (
                                    domains.map((d, i) => (
                                        <View key={i} style={tw`px-3 py-1.5 rounded-full bg-[#16284F21]`}>
                                            <Text style={tw`text-[#16284F] text-sm font-medium`}>{d}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={tw`text-gray-400 text-sm italic`}>No domains specified</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Duration</Text>
                            <View style={tw`self-start px-4 py-1.5 rounded-full bg-[#EFE8FF]`}>
                                <Text style={tw`text-[#5B4FE1] text-sm font-medium`}>{project.duration}</Text>
                            </View>
                        </View>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Team Members</Text>
                            <View style={tw`flex-row items-center flex-wrap`}>
                                {project.teamMembers.length > 0 ? (
                                    project.teamMembers.map((member, i) => (
                                        <MemberAvatar key={i} image={member.image} name={member.name} index={i} />
                                    ))
                                ) : (
                                    <Text style={tw`text-gray-400 text-sm italic`}>No members assigned</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Mentor(s)</Text>
                            <View style={tw`flex-col gap-3`}>
                                {project.mentors.length > 0 ? (
                                    project.mentors.map((mentor, i) => (
                                        <View key={i} style={tw`flex-row items-center gap-3`}>
                                            <Avatar src={mentor.image} size={40} />
                                            <View>
                                                <Text style={tw`text-sm font-semibold text-gray-900`}>{mentor.name}</Text>
                                                <Text style={tw`text-xs text-gray-500`}>Faculty / Guide</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={tw`text-gray-400 text-sm italic`}>No mentor assigned</Text>
                                )}
                            </View>
                        </View>

                        <View style={tw`mb-5`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Marks</Text>
                            <View style={tw`self-start px-4 py-1.5 rounded-full bg-green-50`}>
                                <Text style={tw`text-green-700 text-sm font-semibold`}>{project.marks} pts</Text>
                            </View>
                        </View>

                        <View style={tw`mb-6`}>
                            <Text style={tw`text-lg font-semibold text-gray-900 mb-2`}>Attachments</Text>
                            {project.fileUrls.length > 0 ? (
                                project.fileUrls.map((url, i) => (
                                    <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={tw`mb-2`}>
                                        <Text style={tw`text-blue-600 underline`}>{url.split("/").pop() || "Attachment"}</Text>
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={tw`text-gray-400 text-sm italic`}>No attachments uploaded</Text>
                            )}
                        </View>
                    </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

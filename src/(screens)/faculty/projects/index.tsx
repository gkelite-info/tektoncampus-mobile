import React, { useEffect, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView } from "react-native";
import { ProjectCard, ProjectDetailsModal } from "./components/ProjectCard";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { fetchEnrichedProjectsByFaculty } from "@/lib/helpers/projects/project";
import { ProjectCardProps } from "@/lib/types/project";
import tw from "twrnc";
import AddProjectForm from "./components/AddProjectForm";
import StudentSubmissions from "./components/StudentSubmissions";

import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ViewState = "list" | "add_project" | "submissions";

export default function FacultyProjects() {
    const { facultyId, college_branch, collegeAcademicYear } = useFaculty();
    const insets = useSafeAreaInsets();
    const [view, setView] = useState<ViewState>("list");
    const [activeTab, setActiveTab] = useState<"active" | "previous">("active");
    const [projects, setProjects] = useState<ProjectCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<ProjectCardProps | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        const loadProjects = async () => {
            if (!facultyId) return;
            setIsLoading(true);
            try {
                const enriched = await fetchEnrichedProjectsByFaculty(facultyId);

                const mapped: ProjectCardProps[] = enriched.map((p) => {
                    const isPast = p.endDate
                        ? new Date(p.endDate).getTime() < new Date().getTime()
                        : false;

                    return {
                        projectId: p.projectId,
                        title: p.title,
                        description: p.description ?? "",
                        duration: p.duration,
                        techStack: p.domain.join(", "),
                        mentors: p.mentors,
                        teamMembers: p.teamMembers,
                        marks: p.marks ?? 0,
                        fileUrls: p.fileUrls,
                        status: isPast ? "previous" : "active",
                    };
                });

                setProjects(mapped);
            } catch (err) {
                console.error("Failed to load projects", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (view === "list") {
            loadProjects();
        }
    }, [facultyId, view]);

    const filteredProjects = useMemo(() => {
        return projects.filter((project) => (project.status || "active") === activeTab);
    }, [projects, activeTab]);

    if (view === "add_project") {
        return (
            <AddProjectForm 
                onCancel={() => setView("list")} 
                onSuccess={() => setView("list")} 
            />
        );
    }

    if (view === "submissions" && selectedProject && selectedProject.projectId) {
        return (
            <View style={[tw`flex-1 bg-white`, { paddingTop: insets.top + 105 }]}>
                <View style={tw`p-4 border-b border-gray-100 flex-row items-center`}>
                    <TouchableOpacity onPress={() => setView("list")} style={tw`mr-3`}>
                        <Text style={tw`text-blue-600 font-semibold text-base`}>{"< Back to List"}</Text>
                    </TouchableOpacity>
                </View>
                <StudentSubmissions projectId={selectedProject.projectId} projectTitle={selectedProject.title} />
            </View>
        );
    }

    return (
        <View style={[tw`flex-1 bg-[#F9FAFB]`, { paddingTop: insets.top + 105 }]}>
            <ScrollView style={tw`flex-1 px-4`} contentContainerStyle={tw`pb-20 pt-4`}>
                {}
                <View style={tw`flex-row justify-between items-start mb-6`}>
                    <View style={tw`flex-1 pr-4`}>
                        <Text style={tw`text-2xl font-bold text-black`}>
                            Projects - {college_branch ?? "..."} {collegeAcademicYear}
                        </Text>
                        <Text style={tw`text-sm text-gray-500 mt-1`}>
                            Create, manage, and track student projects effortlessly.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={tw`bg-[#43C17A] px-4 py-2 rounded-lg flex-row items-center mt-1`}
                        onPress={() => setView("add_project")}
                    >
                        <Text style={tw`text-white font-semibold text-sm`}>+ Add Project</Text>
                    </TouchableOpacity>
                </View>

                {}
                <View style={tw`items-center mb-6`}>
                    <View style={tw`flex-row bg-gray-200 p-1 rounded-full relative w-[320px]`}>
                        <MotiView
                            style={[tw`absolute top-1 bottom-1 w-[156px] bg-[#10B981] rounded-full`, { left: 4 }]}
                            animate={{
                                translateX: activeTab === "active" ? 0 : 156
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 120 }}
                        />
                        <TouchableOpacity
                            style={tw`flex-1 py-2 items-center z-10`}
                            onPress={() => setActiveTab("active")}
                        >
                            <Text style={tw`text-sm font-semibold ${activeTab === "active" ? "text-white" : "text-gray-500"}`}>
                                Active Projects
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={tw`flex-1 py-2 items-center z-10`}
                            onPress={() => setActiveTab("previous")}
                        >
                            <Text style={tw`text-sm font-semibold ${activeTab === "previous" ? "text-white" : "text-gray-500"}`}>
                                Previous Projects
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Content */}
                {isLoading ? (
                    <View style={tw`py-10 items-center justify-center`}>
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : filteredProjects.length === 0 ? (
                    <View style={tw`items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200`}>
                        <Text style={tw`text-lg font-semibold text-gray-400`}>No {activeTab} projects found</Text>
                        <Text style={tw`text-sm text-gray-400 mt-1`}>
                            {activeTab === "active" ? "Click 'Add Project' to get started!" : "Projects will appear here once they are completed."}
                        </Text>
                    </View>
                ) : (
                    <ProjectCard
                        data={filteredProjects}
                        role="Faculty"
                        onViewDetails={(project) => {
                            setSelectedProject(project);
                            setIsModalVisible(true);
                        }}
                    />
                )}
            </ScrollView>

            {selectedProject && (
                <ProjectDetailsModal
                    visible={isModalVisible}
                    project={selectedProject}
                    onClose={() => setIsModalVisible(false)}
                    onViewSubmissions={(project) => {
                        setIsModalVisible(false);
                        setSelectedProject(project);
                        setView("submissions");
                    }}
                />
            )}
        </View>
    );
}

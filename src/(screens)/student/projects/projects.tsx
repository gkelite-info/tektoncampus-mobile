import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTranslation } from "react-i18next";
import { Kanban } from "phosphor-react-native";
import { Text } from "@/components/AppText";
import { fonts } from "@/constants/fonts";
import { useStudent } from "@/utils/context/student/useStudent";
import { useUser } from "@/utils/context/UserContext";
import { fetchEnrichedProjectsByStudent } from "@/lib/helpers/projects/project";
import { ProjectCard, ProjectCardProps } from "./components/ProjectCard";
import { ProjectDetailsModal } from "./components/ProjectDetailsModal";
import Shimmer from "@/components/ui/Shimmer";

const ShimmerCard = () => {
  return (
    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 mb-4">
      <View className="flex-row justify-between items-start mb-3 gap-3">
        <View className="flex-1">
          <Shimmer width="75%" height={22} borderRadius={4} className="mb-2" />
          <Shimmer width="100%" height={14} borderRadius={4} className="mt-1" />
          <Shimmer width="60%" height={14} borderRadius={4} className="mt-2" />
        </View>
        <Shimmer width={100} height={32} borderRadius={16} />
      </View>

      <View className="flex-col gap-3 mt-3">
        <View className="flex-row items-center">
          <View className="w-28">
            <Shimmer width={70} height={14} borderRadius={4} />
          </View>
          <Shimmer width={80} height={24} borderRadius={12} />
        </View>

        <View className="flex-row items-center">
          <View className="w-28">
            <Shimmer width={80} height={14} borderRadius={4} />
          </View>
          <Shimmer width="50%" height={14} borderRadius={4} />
        </View>

        {/* Team Members */}
        <View className="flex-row items-center">
          <View className="w-28">
            <Shimmer width={95} height={14} borderRadius={4} />
          </View>
          <View className="flex-row items-center">
            {[1, 2, 3].map((i, index) => (
              <View key={i} className={`rounded-full border-2 border-white ${index > 0 ? "-ml-3" : ""}`}>
                <Shimmer width={32} height={32} borderRadius={16} />
              </View>
            ))}
          </View>
        </View>

        {/* Mentors */}
        <View className="flex-row items-center">
          <View className="w-28">
            <Shimmer width={60} height={14} borderRadius={4} />
          </View>
          <View className="flex-row items-center rounded-full border-2 border-white">
            <Shimmer width={32} height={32} borderRadius={16} />
          </View>
        </View>

        {/* Marks */}
        <View className="flex-row items-center">
          <View className="w-28">
            <Shimmer width={50} height={14} borderRadius={4} />
          </View>
          <Shimmer width={40} height={16} borderRadius={4} />
        </View>

        {/* Attachments */}
        <View className="flex-row items-start mt-2">
          <View className="w-28 mt-0.5">
            <Shimmer width={85} height={14} borderRadius={4} />
          </View>
          <View className="flex-1 flex-row flex-wrap gap-2">
            <Shimmer width={100} height={26} borderRadius={8} />
            <Shimmer width={80} height={26} borderRadius={8} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const { role } = useUser();
  const {
    studentId,
    subjects: studentSubjects,
    collegeBranchCode,
    collegeAcademicYear,
  } = useStudent();

  const [projects, setProjects] = useState<ProjectCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectCardProps | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Completed">("All");
  const [subjectFilter, setSubjectFilter] = useState<"All" | number>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const loadProjects = async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const enriched = await fetchEnrichedProjectsByStudent(studentId);

      const mapped: ProjectCardProps[] = enriched.map((p) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pDate = p.endDate ? new Date(p.endDate) : null;
        const currentStatus = pDate && pDate < today ? "Completed" : "Active";

        return {
          projectId: p.projectId,
          collegeSubjectId: p.collegeSubjectId,
          title: p.title,
          description: p.description ?? "",
          duration: p.duration,
          techStack: p.domain ? p.domain.join(", ") : "",
          mentors: p.mentors || [],
          teamMembers: p.teamMembers || [],
          marks: p.marks ?? 0,
          fileUrls: p.fileUrls || [],
          subject: p.subjectName || "",
          status: currentStatus,
        };
      });

      setProjects(mapped);
    } catch (err) {
      console.error("Failed to load student projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [studentId]);

  const filteredProjects = projects.filter((project) => {
    const matchesSubject =
      subjectFilter === "All" || project.collegeSubjectId === subjectFilter;

    const matchesStatus =
      statusFilter === "All" || project.status === statusFilter;

    return matchesSubject && matchesStatus;
  });

  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-[#F8FAFC]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          padding: 16,
          paddingTop: headerHeight + 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text
            className="text-2xl text-[#1E293B] font-bold"
            style={{ fontFamily: fonts.bold }}
          >
            {t("Projects.student.Projects")} - {collegeBranchCode ?? "..."}{" "}
            {collegeAcademicYear ?? ""}
          </Text>
          <Text
            className="text-sm text-gray-500 mt-1"
            style={{ fontFamily: fonts.regular }}
          >
            {t("Projects.student.View and track your assigned projects")}
          </Text>
        </View>

        <View className="flex-row bg-slate-100 p-1.5 rounded-xl mb-4">
          {(["All", "Active", "Completed"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`flex-1 items-center justify-center py-2.5 rounded-lg ${
                statusFilter === tab ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  statusFilter === tab ? "text-[#43C17A]" : "text-slate-500"
                }`}
                style={{ fontFamily: fonts.medium }}
              >
                {t(`Projects.student.${tab}`, tab)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-6">
          <Text
            className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2"
            style={{ fontFamily: fonts.bold }}
          >
            {t("Projects.student.Subject:")}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <TouchableOpacity
              onPress={() => {
                setSubjectFilter("All");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full border ${
                subjectFilter === "All"
                  ? "bg-[#DCEAE2] border-[#DCEAE2]"
                  : "bg-white border-slate-200"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  subjectFilter === "All" ? "text-[#43C17A]" : "text-slate-600"
                }`}
                style={{ fontFamily: fonts.medium }}
              >
                {t("Projects.student.All")}
              </Text>
            </TouchableOpacity>

            {studentSubjects &&
              studentSubjects.map((sub) => (
                <TouchableOpacity
                  key={sub.collegeSubjectId}
                  onPress={() => {
                    setSubjectFilter(sub.collegeSubjectId);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    subjectFilter === sub.collegeSubjectId
                      ? "bg-[#DCEAE2] border-[#DCEAE2]"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      subjectFilter === sub.collegeSubjectId
                        ? "text-[#43C17A]"
                        : "text-slate-600"
                    }`}
                    style={{ fontFamily: fonts.medium }}
                  >
                    {sub.subjectName}
                  </Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {isLoading ? (
          <View>
            {[1, 2, 3].map((key) => (
              <ShimmerCard key={key} />
            ))}
          </View>
        ) : filteredProjects.length === 0 ? (
          <View className="items-center justify-center py-16 px-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Kanban size={48} color="#94A3B8" />
            <Text
              className="text-slate-700 text-sm font-semibold mt-4 text-center"
              style={{ fontFamily: fonts.bold }}
            >
              {t("Projects.student.No projects found")}
            </Text>
            <Text
              className="text-slate-400 text-xs mt-1 text-center leading-5 max-w-[280px]"
              style={{ fontFamily: fonts.regular }}
            >
              {subjectFilter !== "All" || statusFilter !== "All"
                ? t("Projects.student.We couldnt find any projects for filter")
                : t(
                    "Projects.student.Your faculty hasnt assigned any projects to you yet"
                  )}
            </Text>

            {(subjectFilter !== "All" || statusFilter !== "All") && (
              <TouchableOpacity
                onPress={() => {
                  setSubjectFilter("All");
                  setStatusFilter("All");
                  setCurrentPage(1);
                }}
                className="mt-4"
              >
                <Text
                  className="text-blue-500 text-xs font-bold"
                  style={{ fontFamily: fonts.bold }}
                >
                  {t("Projects.student.Clear all filters")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View>
            <ProjectCard
              data={paginatedProjects}
              onViewDetails={(proj) => setSelectedProject(proj)}
            />
            {totalPages > 1 && (
              <View className="flex-row justify-between items-center mt-4 mb-8">
                <TouchableOpacity
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === 1 ? "bg-slate-200" : "bg-[#22c55e]"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${currentPage === 1 ? "text-slate-500" : "text-white"}`} style={{ fontFamily: fonts.semiBold }}>
                    {t("Projects.student.Previous", "Previous")}
                  </Text>
                </TouchableOpacity>
                <Text className="text-sm font-semibold text-slate-700" style={{ fontFamily: fonts.medium }}>
                  {currentPage} / {totalPages}
                </Text>
                <TouchableOpacity
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={`px-4 py-2 rounded-lg ${
                    currentPage === totalPages ? "bg-slate-200" : "bg-[#22c55e]"
                  }`}
                >
                  <Text className={`text-xs font-semibold ${currentPage === totalPages ? "text-slate-500" : "text-white"}`} style={{ fontFamily: fonts.semiBold }}>
                    {t("Projects.student.Next", "Next")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          onClose={() => {
            setSelectedProject(null);
            loadProjects(); 
          }}
          role={role}
          studentId={studentId}
        />
      )}
    </SafeAreaView>
  );
}
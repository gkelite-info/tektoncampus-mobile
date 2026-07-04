import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { supabase } from "@/lib/supabaseClient";
import { fetchAssignmentsForStudent } from "@/lib/helpers/student/assignments/assignmentsAPI";
import { Loader } from "../calendar/right/timetable";
import { CaretLeft, CaretRight } from "phosphor-react-native";
import { fetchStudentDiscussionUploads } from "@/lib/helpers/student/assignments/discussionForum/student_discussion_uploadsAPI";
import { fetchActiveQuizzesForStudent, fetchAttemptedQuizzesForStudent } from "@/lib/helpers/quiz/quizAPI";
import { fetchSubmissionDetails, getStudentAttemptCount } from "@/lib/helpers/quiz/quizSubmissionAPI";
import { useTranslations } from "@/utils/useTranslations";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fonts } from "@/constants/fonts";
import FacultyLabCard, { type LabManual } from "../../faculty/assignments/components/FacultyLabCard";
import { fetchLabManualsForStudent, getLabManualPublicUrl } from "@/lib/helpers/faculty/facultyLabManualHelper";
import AssignmentCardMobile from "./components/card";
import { getSubmissionDetailsForAssignment } from "@/lib/helpers/student/assignments/insertAssignmentSubmission";
import QuizCard, { AttemptedQuizCard } from "./components/quizCard";
import QuizViewAnswersScreen from "./components/quizViewAnswersScreen";
import QuizPerformanceModal from "./components/quizPerformanceModal";
import QuizAttemptScreen from "./components/QuizAttemptScreen";
import StudentDiscussionCard from "./components/studentDiscussionCard";
import { AssignmentCardSkeletonGroup } from "./AssignmentCardSkeletonGroup";
import { StudentDiscussionDetailsModal, StudentDiscussionUploadModal } from "./components/studentDiscussionModals";
import { useStudent } from "@/utils/context/student/useStudent";
import { fetchActiveDiscussionsForStudent, fetchCompletedDiscussionsForStudent } from "@/lib/helpers/student/assignments/discussionForum/studentDiscussionAPI";
import { QuizCardSkeletonGroup } from "./components/QuizCardShimmer";
import { Pagination } from "@/components/pagination";
import { StudentDiscussionCardSkeletonGroup } from "./components/StudentDiscussionCardShimmer";
import { useHeaderHeight } from "@react-navigation/elements";
function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
type StudentLabManualRow = {
  labManualId: number;
  labTitle: string;
  collegeSubjectId: number;
  collegeAcademicYearId: number;
  collegeSectionsId: number;
  pdfUrl: string;
  description?: string | null;
  fileSize?: number;
  createdAt: string;
  college_subjects?: {
    subjectName?: string | null;
  } | null;
  college_sections?: {
    sectionName?: string | null;
    collegeSections?: string | null;
  } | null;
};
function AssignmentsLeftContent() {
  const {
    t
  } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const searchParams = route.params || {};
  const action = searchParams.action;
  const activeQuizId = searchParams.quizId;
  const activeDiscussionId = searchParams.discussionId;
  const activeModal = searchParams.modal;
  const activeTab = searchParams.tab || "assignments";
  const activeView = searchParams.view as "active" | "previous" || "active";
  const quizView = searchParams.quizView as "ongoing" | "attempted" || "ongoing";
  const discussionView = searchParams.discussionView as "active" | "completed" || "active";
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [previousAssignments, setPreviousAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const rowsPerPage = 10;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const headerHeight = useHeaderHeight();
  const [discussionUploads, setDiscussionUploads] = useState<Record<string, any[]>>({});
  const {
    collegeId,
    collegeEducationId,
    collegeBranchId,
    collegeAcademicYearId,
    collegeSectionsId,
    studentId
  } = useStudent();
  const [activeDiscussions, setActiveDiscussions] = useState<any[]>([]);
  const [completedDiscussions, setCompletedDiscussions] = useState<any[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [ongoingQuizzes, setOngoingQuizzes] = useState<any[]>([]);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<any[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizSubTabLoading, setQuizSubTabLoading] = useState(false);
  const [discussionSubTabLoading, setDiscussionSubTabLoading] = useState(false);
  const [assignmentSubTabLoading, setAssignmentSubTabLoading] = useState(false);
  const [tabSwitchLoading, setTabSwitchLoading] = useState(false);
  const [quizRefreshKey, setQuizRefreshKey] = useState(0);
  const [quizCurrentPage, setQuizCurrentPage] = useState(1);
  const [discussionCurrentPage, setDiscussionCurrentPage] = useState(1);
  const [labCurrentPage, setLabCurrentPage] = useState(1);
  const QUIZ_PER_PAGE = 8;
  const [quizTotalRecords, setQuizTotalRecords] = useState(0);
  const DISCUSSION_PER_PAGE = 8;
  const LAB_PER_PAGE = 8;
  const [labs, setLabs] = useState<LabManual[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [labTotalRecords, setLabTotalRecords] = useState(0);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const submissionId = searchParams.submissionId;
  useEffect(() => {
    if (activeModal === "performance" && submissionId) {
      loadPerformanceData(Number(submissionId));
    }
  }, [activeModal, submissionId]);
  async function loadPerformanceData(submissionId: number) {
    const {
      t
    } = useTranslation();
    try {
      setPerformanceLoading(true);
      const answers = await fetchSubmissionDetails(submissionId);
      const correct = answers.filter((a: any) => a.isCorrect).length;
      const wrong = answers.filter((a: any) => !a.isCorrect && (a.selectedOptionId || a.writtenAnswer)).length;
      const unanswered = answers.filter((a: any) => !a.selectedOptionId && !a.writtenAnswer).length;
      const total = answers.length;
      const submission = attemptedQuizzes.find((s: any) => s.submissionId === submissionId);
      const quiz = submission?.quizzes;
      const marksObtained = submission?.totalMarksObtained ?? 0;
      const totalMarks = quiz?.totalMarks ?? 0;
      const percentage = totalMarks > 0 ? Math.round(marksObtained / totalMarks * 100) : 0;
      const quizMaxAttempts = quiz?.maxAttempts ?? 3;
      setPerformanceData({
        id: quiz?.quizId,
        courseName: quiz?.college_subjects?.subjectName || "-",
        topic: quiz?.quizTitle || "-",
        facultyName: quiz?.faculty?.fullName || "-",
        attemptedOn: formatDate(submission?.submittedAt),
        questionsAttempted: `${submission?.answersCount ?? 0} / ${submission?.totalQuestionsCount ?? 0}`,
        attemptsUsed: `${submission?.attemptNumber} ${t("Assignment.student.of")} ${quizMaxAttempts}`,
        score: `${marksObtained} / ${totalMarks}`,
        bgColor: "bg-[#481451]",
        percentage,
        correct,
        wrong,
        unanswered,
        total,
        allAttemptsUsed: (submission?.attemptNumber ?? 0) >= quizMaxAttempts
      });
    } catch (err) {
      console.error("loadPerformanceData error:", err);
    } finally {
      setPerformanceLoading(false);
    }
  }
  async function loadQuizzes() {
    if (!collegeSectionsId || !studentId) return;
    try {
      setQuizzesLoading(true);
      if (quizView === "ongoing") {
        const {
          data,
          totalCount
        } = await fetchActiveQuizzesForStudent(collegeSectionsId, quizCurrentPage, QUIZ_PER_PAGE);
        const ongoingWithAttempts = await Promise.all(data.map(async (quiz: any) => {
          const count = await getStudentAttemptCount(quiz.quizId, studentId as number);
          return {
            ...quiz,
            attemptsLeft: quiz.maxAttempts - count
          };
        }));
        const filteredOngoing = ongoingWithAttempts.filter(q => q.attemptsLeft > 0);
        setOngoingQuizzes(filteredOngoing);
        setQuizTotalRecords(totalCount);
      } else {
        const {
          data,
          totalCount
        } = await fetchAttemptedQuizzesForStudent(studentId, quizCurrentPage, QUIZ_PER_PAGE);
        setAttemptedQuizzes(data);
        setQuizTotalRecords(totalCount);
      }
    } catch (err) {
      console.error("loadQuizzes error:", err);
    } finally {
      setQuizzesLoading(false);
    }
  }
  useEffect(() => {
    if (activeTab === "quiz") {
      loadQuizzes();
    }
  }, [activeTab, collegeSectionsId, studentId, quizRefreshKey, quizCurrentPage, quizView]);
  async function loadDiscussions() {
    if (!collegeSectionsId || !studentId) return;
    try {
      setDiscussionsLoading(true);
      const [active, completed] = await Promise.all([fetchActiveDiscussionsForStudent(collegeSectionsId, studentId), fetchCompletedDiscussionsForStudent(collegeSectionsId)]);
      const activeWithUploads = await Promise.all(active.map(async (discussion: any) => {
        const uploads = await fetchStudentDiscussionUploads(studentId, discussion.discussionId);
        return {
          ...discussion,
          studentUploads: uploads
        };
      }));
      setActiveDiscussions(activeWithUploads);
      setCompletedDiscussions(completed);
    } catch (err) {
      console.error("loadDiscussions error:", err);
    } finally {
      setDiscussionsLoading(false);
    }
  }
  useEffect(() => {
    if (activeTab === "discussion" && collegeSectionsId) {
      loadDiscussions();
    }
  }, [activeTab, collegeSectionsId]);
  async function loadLabs() {
    if (!collegeId || !collegeEducationId || !collegeBranchId || !collegeAcademicYearId || !collegeSectionsId) {
      return;
    }
    try {
      setLabsLoading(true);
      const response = await fetchLabManualsForStudent({
        collegeId,
        collegeEducationId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSectionsId
      }, labCurrentPage, LAB_PER_PAGE);
      const formatted = response.data.map((lab: StudentLabManualRow) => {
        return {
          labId: lab.labManualId,
          labTitle: lab.labTitle,
          collegeSubjectId: lab.collegeSubjectId,
          collegeAcademicYearId: lab.collegeAcademicYearId,
          collegeSectionsId: lab.collegeSectionsId,
          pdfUrl: lab.pdfUrl,
          subjectName: lab.college_subjects?.subjectName || undefined,
          sectionName: lab.college_sections?.sectionName || lab.college_sections?.collegeSections || undefined,
          description: lab.description || undefined,
          fileName: lab.pdfUrl?.split("/").pop() || "Lab manual.pdf",
          fileSize: lab.fileSize ?? 0,
          fileUrl: undefined,
          uploadedAt: lab.createdAt
        };
      });
      setLabs(formatted);
      setLabTotalRecords(response.totalCount || 0);
    } catch (err) {
      console.error("loadLabs error:", err);
    } finally {
      setLabsLoading(false);
    }
  }
  useEffect(() => {
    if (activeTab === "lab" && collegeSectionsId) {
      loadLabs();
    }
  }, [activeTab, collegeId, collegeEducationId, collegeBranchId, collegeAcademicYearId, collegeSectionsId, labCurrentPage]);
  useEffect(() => {
    if (activeTab === "quiz") {
      setQuizSubTabLoading(true);
      const timer = setTimeout(() => {
        setQuizSubTabLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [quizView, activeTab]);
  useEffect(() => {
    if (activeTab === "discussion") {
      setDiscussionSubTabLoading(true);
      const timer = setTimeout(() => {
        setDiscussionSubTabLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [discussionView, activeTab]);
  useEffect(() => {
    if (activeTab === "assignments") {
      setAssignmentSubTabLoading(true);
      const timer = setTimeout(() => {
        setAssignmentSubTabLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeView]);
  useEffect(() => {
    setTabSwitchLoading(true);
    const timer = setTimeout(() => {
      setTabSwitchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const setParams = (updates: Record<string, string | undefined>) => {
    navigation.setParams(updates);
  };
  const handleTabChange = (tab: "assignments" | "quiz" | "discussion" | "lab") => {
    const updates: Record<string, string | undefined> = {
      tab,
      action: undefined,
      quizId: undefined,
      discussionId: undefined,
      modal: undefined
    };
    if (tab === "assignments") updates.view = "active";
    if (tab === "quiz") updates.quizView = "ongoing";
    if (tab === "discussion") updates.discussionView = "active";
    setLabCurrentPage(1);
    setParams(updates);
  };
  const handleViewChange = (view: "active" | "previous") => {
    setParams({
      view
    });
  };
  const handleQuizViewChange = (view: "ongoing" | "attempted") => {
    setQuizCurrentPage(1);
    setParams({
      quizView: view
    });
  };
  const handleDiscussionViewChange = (view: "active" | "completed") => {
    setParams({
      discussionView: view
    });
  };
  useEffect(() => {
    loadAssignments();
  }, [activeView, currentPage]);
  async function loadAssignments() {
    try {
      setLoading(true);
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("User not authenticated");
      }
      const {
        data: userRow,
        error: userErr
      } = await supabase.from("users").select("userId, role").eq("auth_id", user.id).eq("is_deleted", false).single();
      if (userErr || !userRow || userRow.role !== "Student") {
        throw new Error("Invalid student user");
      }
      const {
        data: student
      } = await supabase.from("students").select("studentId, collegeBranchId").eq("userId", userRow.userId).is("deletedAt", null).single();
      if (!student) {
        throw new Error("Student record not found");
      }
      const {
        data: academic
      } = await supabase.from("student_academic_history").select("collegeAcademicYearId, collegeSectionsId").eq("studentId", student.studentId).eq("isCurrent", true).is("deletedAt", null).single();
      if (!academic) {
        throw new Error("Academic context not found");
      }
      const res = await fetchAssignmentsForStudent({
        collegeBranchId: student.collegeBranchId,
        collegeAcademicYearId: academic.collegeAcademicYearId,
        collegeSectionsId: academic.collegeSectionsId
      }, currentPage, rowsPerPage, activeView);
      if (!res.success) {
        throw new Error(res.error);
      }
      setTotalRecords(res.totalCount);
      const todayInt = Number(formatDateToInt(new Date()));
      const formatted = await Promise.all(res.assignments.map(async (a: any) => {
        const submission = await getSubmissionDetailsForAssignment(a.assignmentId);
        const marksScored = submission?.marksScored !== null && submission?.marksScored !== undefined ? submission.marksScored : null;
        return {
          assignmentId: a.assignmentId,
          status: a.status,
          image: require("../../../../assets/ds.jpg"),
          title: a.topicName,
          topicName: a.topicName,
          subjectName: a.subject?.subjectName ?? "—",
          professor: a.faculty?.user?.fullName ?? "Faculty",
          marksTotal: a.marks,
          marksScored,
          fromDate: convertIntToShow(a.dateAssignedInt),
          toDate: convertIntToShow(a.submissionDeadlineInt),
          toDateInt: a.submissionDeadlineInt,
          existingFilePath: submission?.file ?? null
        };
      }));
      setActiveAssignments(formatted.filter(a => a.toDateInt >= todayInt));
      setPreviousAssignments(formatted.filter(a => a.toDateInt < todayInt));
    } catch (err) {
      console.error("Failed to load assignments:", err);
    } finally {
      setLoading(false);
    }
  }
  function convertIntToShow(intVal: number) {
    if (!intVal) return "";
    const s = intVal.toString();
    const year = s.slice(0, 4);
    const month = s.slice(4, 6);
    const day = s.slice(6, 8);
    return `${day}/${month}/${year}`;
  }
  function formatDateToInt(date: Date) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  }
  if (activeTab === "quiz" && activeQuizId && action === "attempt") {
    const activeQuizData = ongoingQuizzes.find(q => q.quizId.toString() === activeQuizId);
    return <View className="w-full p-2 flex-1">
                <QuizAttemptScreen quiz={{
        id: activeQuizData?.quizId,
        courseName: activeQuizData?.college_subjects?.subjectName || "-",
        topic: activeQuizData?.quizTitle || "-",
        durationMinutes: activeQuizData?.durationMinutes ?? 30
      }} navigation={navigation} onSubmitSuccess={async () => {
        await loadQuizzes();
        setQuizRefreshKey(prev => prev + 1);
        setParams({
          action: undefined,
          quizId: undefined,
          tab: "quiz",
          quizView: "attempted"
        });
      }} />
        
            </View>;
  }
  if (activeTab === "quiz" && action === "viewAnswers") {
    const submission = attemptedQuizzes.find((s: any) => s.quizzes?.quizId?.toString() === activeQuizId);
    const quiz = submission?.quizzes;
    return <View className="w-full p-2 flex-1">
                <QuizViewAnswersScreen quiz={{
        courseName: quiz?.college_subjects?.subjectName || "-",
        topic: quiz?.quizTitle || "-",
        score: `${submission?.totalMarksObtained ?? 0}/${quiz?.totalMarks ?? 0}`,
        totalMarks: quiz?.totalMarks ?? 0,
        totalMarksObtained: submission?.totalMarksObtained ?? 0
      }} routeParams={{
        quizId: quiz?.quizId || "",
        submissionId: submission?.id || ""
      }} onBack={params => {
        console.log("Back clicked, requested modal:", params.modal);
      }} />
        
            </View>;
  }
  const activeDiscussionData = activeDiscussionId ? [...activeDiscussions, ...completedDiscussions].find(d => String(d.discussionId) === String(activeDiscussionId)) : null;
  return <View className="w-full px-3 py-0 flex-1 bg-white" style={{
    paddingTop: headerHeight + 16
  }}>
            {activeModal === "performance" && activeQuizId && (performanceLoading ? <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
                        <Loader />
                    </View> : performanceData ? <QuizPerformanceModal visible={activeModal === "performance"} quiz={performanceData} onClose={() => setParams({
      modal: undefined,
      quizId: undefined,
      submissionId: undefined
    })} onViewAnswers={() => {
      setParams({
        action: "viewAnswers",
        modal: undefined
      });
    }} /> : null)}
            {activeModal === "uploadDiscussion" && activeDiscussionData && <StudentDiscussionUploadModal discussion={activeDiscussionData} onUpload={(files: any) => {
      setDiscussionUploads(prev => ({
        ...prev,
        [activeDiscussionData.discussionId]: files
      }));
    }} onSuccess={loadDiscussions} />}
            {activeModal === "viewDiscussion" && activeDiscussionData && <StudentDiscussionDetailsModal discussion={activeDiscussionData} />}

            <View className="mb-2">
                <View className="mb-3 mt-0">
                    <Text className="text-2xl mb-1 text-[#282828]" style={{
          fontFamily: fonts.bold
        }}>
                        {t("Assignment.student.Assignments")}
                    </Text>
                    <Text className="text-[#282828] text-base" style={{
          fontFamily: fonts.regular
        }}>
                        {t("Assignment.student.View, track, and submit your work with ease")}
                    </Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-5 border-b border-gray-200 mt-2 mb-2" contentContainerStyle={{
        alignItems: "center"
      }}>
          
                    <TouchableOpacity onPress={() => handleTabChange("assignments")} className={`mr-5 pb-2 border-b-2 ${activeTab === "assignments" ? "border-[#43C17A]" : "border-transparent"}`}>
            
                        <Text className={`text-lg ${activeTab === "assignments" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
            fontFamily: fonts.bold
          }}>
              
                            {t("Assignment.student.Assignments")}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleTabChange("quiz")} className={`mr-5 pb-2 border-b-2 ${activeTab === "quiz" ? "border-[#43C17A]" : "border-transparent"}`}>
            
                        <Text className={`text-lg ${activeTab === "quiz" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
            fontFamily: fonts.bold
          }}>
              
                            {t("Assignment.student.Quiz")}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleTabChange("discussion")} className={`mr-5 pb-2 border-b-2 ${activeTab === "discussion" ? "border-[#43C17A]" : "border-transparent"}`}>
            
                        <Text className={`text-lg ${activeTab === "discussion" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
            fontFamily: fonts.bold
          }}>
              
                            {t("Assignment.student.Discussion forum")}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleTabChange("lab")} className={`mr-5 pb-2 border-b-2 ${activeTab === "lab" ? "border-[#43C17A]" : "border-transparent"}`}>
            
                        <Text className={`text-lg ${activeTab === "lab" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
            fontFamily: fonts.bold
          }}>{t("Assignment.student.Lab", "Lab")}


            </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View className="w-full flex-1">
                {activeTab !== "lab" && <View className="flex-row w-full border-b border-gray-200 mb-4 mt-0">
                        {activeTab === "assignments" && <>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${activeView === "active" ? "border-[#43C17A]" : "border-transparent"}`} onPress={() => handleViewChange("active")}>
              
                                    <Text className={`text-base ${activeView === "active" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
              fontFamily: fonts.semiBold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Active")}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${activeView === "previous" ? "border-gray-800" : "border-transparent"}`} onPress={() => handleViewChange("previous")}>
              
                                    <Text className={`text-base ${activeView === "previous" ? "text-gray-800" : "text-gray-500"}`} style={{
              fontFamily: fonts.semiBold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Previous")}
                                    </Text>
                                </TouchableOpacity>
                            </>}
                        {activeTab === "quiz" && <>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${quizView === "ongoing" ? "border-[#43C17A]" : "border-transparent"}`} onPress={() => handleQuizViewChange("ongoing")}>
              
                                    <Text className={`text-sm ${quizView === "ongoing" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
              fontFamily: fonts.bold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Ongoing Quizzes")}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${quizView === "attempted" ? "border-[#43C17A]" : "border-transparent"}`} onPress={() => handleQuizViewChange("attempted")}>
              
                                    <Text className={`text-sm ${quizView === "attempted" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
              fontFamily: fonts.bold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Questions Attempted")}
                                    </Text>
                                </TouchableOpacity>
                            </>}
                        {activeTab === "discussion" && <>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${discussionView === "active" ? "border-[#43C17A]" : "border-transparent"}`} onPress={() => handleDiscussionViewChange("active")}>
              
                                    <Text className={`text-sm ${discussionView === "active" ? "text-[#43C17A]" : "text-gray-500"}`} style={{
              fontFamily: fonts.bold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Active Discussions")}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity className={`flex-1 pb-2 items-center border-b-2 ${discussionView === "completed" ? "border-gray-800" : "border-transparent"}`} onPress={() => handleDiscussionViewChange("completed")}>
              
                                    <Text className={`text-sm ${discussionView === "completed" ? "text-gray-800" : "text-gray-500"}`} style={{
              fontFamily: fonts.bold
            }} numberOfLines={1} adjustsFontSizeToFit>
                
                                        {t("Assignment.student.Completed Discussions")}
                                    </Text>
                                </TouchableOpacity>
                            </>}
                    </View>}

                <ScrollView className="mt-2" contentContainerStyle={{
        paddingBottom: 24
      }}>
                    {activeTab === "assignments" && (loading || tabSwitchLoading || assignmentSubTabLoading ? <AssignmentCardSkeletonGroup count={4} /> : <>
                                {activeView === "active" && (activeAssignments.length > 0 ? <AssignmentCardMobile cardProp={activeAssignments} activeView={activeView} /> : <Text className="text-sm text-gray-500 mt-4 text-center" style={{
            fontFamily: fonts.regular
          }}>
                                            {t("Assignment.student.No active assignments available")}
                                        </Text>)}

                                {activeView === "previous" && (previousAssignments.length > 0 ? <View className="text-sm text-[#282828]">
                                            <AssignmentCardMobile cardProp={previousAssignments} activeView="previous" />
              
                                        </View> : <Text className="text-sm text-gray-500 mt-4 text-center" style={{
            fontFamily: fonts.regular
          }}>
                                            {t("Assignment.student.No assignments available")}
                                        </Text>)}
                            </>)}

                    {activeTab === "quiz" && <>
                            {quizView === "ongoing" && <View className="flex-col h-full">
                                    {quizzesLoading || quizSubTabLoading ? <QuizCardSkeletonGroup count={3} /> : ongoingQuizzes.length === 0 ? <View className="items-center justify-center h-1/3 mt-10">
                                            <Text className="text-sm text-gray-500" style={{
                fontFamily: fonts.regular
              }}>
                                                {t("Assignment.student.No ongoing quizzes available")}
                                            </Text>
                                        </View> : ongoingQuizzes.map((quiz, index) => {
              const bgColors = ["bg-[#481451]", "bg-[#182142]", "bg-[#1B1A40]", "bg-[#2E1851]", "bg-[#0A2647]"];
              return <QuizCard key={quiz.quizId} data={{
                id: quiz.quizId,
                courseName: quiz.college_subjects?.subjectName || "-",
                topic: quiz.quizTitle,
                facultyName: quiz.faculty?.fullName || "-",
                attemptsLeft: quiz.attemptsLeft,
                quizDuration: `${formatDate(quiz.startDate)} → ${formatDate(quiz.endDate)}`,
                bgColor: bgColors[index % bgColors.length],
                timeLimit: `${quiz.durationMinutes || 30} mins`
              }} onStartQuiz={quizId => {
                setParams({
                  action: "attempt",
                  quizId
                });
              }} />;
            })}
                                </View>}

                            {quizView === "attempted" && <View className="flex-col h-full">
                                    {quizzesLoading || quizSubTabLoading ? <QuizCardSkeletonGroup count={3} /> : attemptedQuizzes.length === 0 ? <View className="items-center justify-center h-1/3 mt-10">
                                            <Text className="text-sm text-gray-500" style={{
                fontFamily: fonts.regular
              }}>
                                                {t("Assignment.student.No attempted quizzes yet")}
                                            </Text>
                                        </View> : attemptedQuizzes.map((submission, index) => {
              
              const bgColors = ["bg-[#481451]", "bg-[#182142]", "bg-[#1B1A40]", "bg-[#2E1851]", "bg-[#0A2647]"];
              const quiz = submission.quizzes;
              return <AttemptedQuizCard key={submission.submissionId} data={{
                id: quiz?.quizId,
                submissionId: submission.submissionId,
                courseName: quiz?.college_subjects?.subjectName || "-",
                topic: quiz?.quizTitle || "-",
                facultyName: quiz?.faculty?.fullName || "-",
                attemptedOn: formatDate(submission.submittedAt),
                questionsAttempted: `${submission.answersCount ?? 0} / ${submission.totalQuestionsCount ?? 0}`,
                attemptsUsed: `${submission.attemptNumber} ${t("Assignment.student.of")} ${quiz?.maxAttempts ?? 3}`,
                score: `${submission.totalMarksObtained} / ${quiz?.totalMarks ?? "-"}`,
                bgColor: bgColors[index % bgColors.length]
              }} onOpenPerformanceModal={(quizId, submissionId) => {
                setParams({
                  modal: "performance",
                  quizId,
                  submissionId
                });
              }} />;
            })}
                                </View>}
                        </>}

                    {activeTab === "discussion" && <View className="flex-col gap-4 pb-10 h-full">
                            {discussionsLoading || discussionSubTabLoading ? <StudentDiscussionCardSkeletonGroup count={3} /> : <>
                                    {discussionView === "active" && (activeDiscussions.length === 0 ? <View className="items-center justify-center h-1/3 mt-10">
                                                <Text className="text-sm text-gray-500" style={{
                fontFamily: fonts.regular
              }}>
                                                    {t("Assignment.student.No active discussions found")}
                                                </Text>
                                            </View> : activeDiscussions.slice((discussionCurrentPage - 1) * DISCUSSION_PER_PAGE, discussionCurrentPage * DISCUSSION_PER_PAGE).map(discussion => <StudentDiscussionCard key={discussion.discussionId} data={discussion} uploadedFiles={discussion.studentUploads || []} onRemoveFile={(studentDiscussionUploadId: any) => {
              setActiveDiscussions(prev => prev.map(d => d.discussionId === discussion.discussionId ? {
                ...d,
                studentUploads: d.studentUploads.filter((f: any) => f.studentDiscussionUploadId !== studentDiscussionUploadId)
              } : d));
            }} />))}
                                    {discussionView === "completed" && (completedDiscussions.length === 0 ? <View className="items-center justify-center h-1/3 mt-10">
                                                <Text className="text-sm text-gray-500" style={{
                fontFamily: fonts.regular
              }}>
                                                    {t("Assignment.student.No completed discussions found")}
                                                </Text>
                                            </View> : completedDiscussions.slice((discussionCurrentPage - 1) * DISCUSSION_PER_PAGE, discussionCurrentPage * DISCUSSION_PER_PAGE).map(discussion => <StudentDiscussionCard key={discussion.discussionId} data={discussion} isCompleted={true} uploadedFiles={discussionUploads[discussion.discussionId] || []} />))}
                                </>}
                        </View>}

                    {activeTab === "lab" && <View className="flex-col gap-4 pb-10 h-full mt-2">
                            {labsLoading || tabSwitchLoading ? <StudentDiscussionCardSkeletonGroup count={3} /> : labs.length === 0 ? <View className="items-center justify-center h-1/3 mt-10">
                                    <Text className="text-sm text-gray-500" style={{
              fontFamily: fonts.regular
            }}>{t("Assignment.student.No lab manuals available", "No lab manuals available")}

              </Text>
                                </View> : labs.map(lab => <FacultyLabCard key={lab.labId} data={lab} />)}
                        </View>}
                </ScrollView>

                {activeTab === "assignments" && totalPages > 1 && <View className="flex-row justify-center items-center gap-2 mt-6 pb-6">
                        <TouchableOpacity onPress={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`p-2 rounded-lg border bg-white ${currentPage === 1 ? "opacity-30" : ""}`}>
            
                            <CaretLeft size={18} weight="bold" color="black" />
                        </TouchableOpacity>
                        <View className="flex-row gap-1">
                            {[...Array(totalPages)].map((_, i) => <TouchableOpacity key={i + 1} onPress={() => setCurrentPage(i + 1)} className={`w-9 h-9 rounded-lg items-center justify-center ${currentPage === i + 1 ? "bg-[#16284F]" : "bg-white border border-gray-300"}`}>
              
                                    <Text className={`text-sm font-bold ${currentPage === i + 1 ? "text-white" : "text-gray-600"}`} style={{
              fontFamily: fonts.bold
            }}>
                
                                        {i + 1}
                                    </Text>
                                </TouchableOpacity>)}
                        </View>
                        <TouchableOpacity onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={`p-2 rounded-lg border bg-white ${currentPage === totalPages ? "opacity-30" : ""}`}>
            
                            <CaretRight size={18} weight="bold" color="black" />
                        </TouchableOpacity>
                    </View>}

                {activeTab === "quiz" && (() => {
        const quizTotalPages = Math.ceil(quizTotalRecords / QUIZ_PER_PAGE);
        return quizTotalPages > 1 && !quizzesLoading && !quizSubTabLoading ? <View className="flex-row justify-center items-center gap-2 mt-6 pb-6">
                                <Pagination currentPage={quizCurrentPage} totalItems={quizTotalRecords} itemsPerPage={QUIZ_PER_PAGE} onPageChange={setQuizCurrentPage} />
            
                            </View> : null;
      })()}

                {activeTab === "discussion" && (() => {
        const list = discussionView === "active" ? activeDiscussions : completedDiscussions;
        const discTotalPages = Math.ceil(list.length / DISCUSSION_PER_PAGE);
        return discTotalPages > 1 && !discussionsLoading && !discussionSubTabLoading ? <View className="flex-row justify-center items-center gap-2 mt-6 pb-6">
                                <TouchableOpacity onPress={() => setDiscussionCurrentPage(p => Math.max(1, p - 1))} disabled={discussionCurrentPage === 1} className={`p-2 rounded-lg border bg-white ${discussionCurrentPage === 1 ? "opacity-30" : ""}`}>
              
                                    <CaretLeft size={18} weight="bold" color="black" />
                                </TouchableOpacity>
                                <View className="flex-row gap-1">
                                    {[...Array(discTotalPages)].map((_, i) => <TouchableOpacity key={i + 1} onPress={() => setDiscussionCurrentPage(i + 1)} className={`w-9 h-9 rounded-lg items-center justify-center ${discussionCurrentPage === i + 1 ? "bg-[#16284F]" : "bg-white border border-gray-300"}`}>
                
                                            <Text className={`text-sm font-bold ${discussionCurrentPage === i + 1 ? "text-white" : "text-gray-600"}`} style={{
                fontFamily: fonts.bold
              }}>
                  
                                                {i + 1}
                                            </Text>
                                        </TouchableOpacity>)}
                                </View>
                                <TouchableOpacity onPress={() => setDiscussionCurrentPage(p => Math.min(discTotalPages, p + 1))} disabled={discussionCurrentPage === discTotalPages} className={`p-2 rounded-lg border bg-white ${discussionCurrentPage === discTotalPages ? "opacity-30" : ""}`}>
              
                                    <CaretRight size={18} weight="bold" color="black" />
                                </TouchableOpacity>
                            </View> : null;
      })()}

                {activeTab === "lab" && (() => {
        const labTotalPages = Math.ceil(labTotalRecords / LAB_PER_PAGE);
        return labTotalPages > 1 && !labsLoading ? <View className="flex-row justify-center items-center gap-3 mt-6 mb-6">
                                <TouchableOpacity onPress={() => setLabCurrentPage(p => Math.max(1, p - 1))} disabled={labCurrentPage === 1} className={`w-10 h-10 items-center justify-center rounded-lg border ${labCurrentPage === 1 ? "border-gray-200" : "border-gray-300"}`}>
              
                                    <CaretLeft size={18} weight="bold" color={labCurrentPage === 1 ? "#D1D5DB" : "#4B5563"} />
              
                                </TouchableOpacity>

                                {[...Array(labTotalPages)].map((_, i) => <TouchableOpacity key={i} onPress={() => setLabCurrentPage(i + 1)} className={`w-10 h-10 rounded-lg items-center justify-center ${labCurrentPage === i + 1 ? "bg-[#16284F]" : "border border-gray-300"}`}>
              
                                        <Text className={`font-semibold ${labCurrentPage === i + 1 ? "text-white" : "text-gray-600"}`} style={{
              fontFamily: fonts.semiBold
            }}>
                
                                            {i + 1}
                                        </Text>
                                    </TouchableOpacity>)}

                                <TouchableOpacity onPress={() => setLabCurrentPage(p => Math.min(labTotalPages, p + 1))} disabled={labCurrentPage === labTotalPages} className={`w-10 h-10 items-center justify-center rounded-lg border ${labCurrentPage === labTotalPages ? "border-gray-200" : "border-gray-300"}`}>
              
                                    <CaretRight size={18} weight="bold" color={labCurrentPage === labTotalPages ? "#D1D5DB" : "#4B5563"} />
              
                                </TouchableOpacity>
                            </View> : null;
      })()}
            </View>
        </View>;
}
export default function AssignmentsLeft() {
  return <AssignmentsLeftContent />;
}
export function Assignments() {
  return <View className="flex-row items-start justify-between flex-1">
            <AssignmentsLeft />
        </View>;
}
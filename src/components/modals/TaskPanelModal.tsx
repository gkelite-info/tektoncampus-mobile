import { Text } from '@/components/AppText';
import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle, X, PencilSimple, Trash } from "phosphor-react-native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import TaskModal from "./TaskModal";
import { deactivateFacultyTask, fetchFacultyTasksForStudent } from "@/lib/helpers/faculty/facultyTasks";
import { deactivateStudentTask, fetchStudentTasksForLoggedInStudent } from "@/lib/helpers/student/studentTaskAPI";
import { useUser } from "@/utils/context/UserContext";
export type Task = {
  facultyTaskId: number;
  title: string;
  description: string;
  time: string;
  date: string;
};
export type TaskPanelModalProps = {
  open: boolean;
  onClose: () => void;
  role?: "faculty" | "student";
  style?: boolean;
  loading?: boolean;
  collegeSubjectId?: number;
  facultyId?: number;
  studentId?: number;
  onEditTask?: (task: Task) => void;
  onAddTask?: () => void;
  onSaveTask?: (payload: {
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
  }, taskId?: number) => Promise<void>;
  onDeleteTask?: (taskId: number) => Promise<void>;
};
export default function TaskPanelModal({
  open,
  onClose,
  role = "student",
  style = false,
  collegeSubjectId,
  facultyId,
  studentId,
  loading = false,
  onEditTask,
  onAddTask,
  onSaveTask,
  onDeleteTask
}: TaskPanelModalProps) {
  const {
    t
  } = useTranslation();
  const {
    collegeId,
    collegeBranchId,
    collegeAcademicYearId,
    collegeSemesterId
  } = useUser();
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [activeView, setActiveView] = useState<"student" | "faculty">("faculty");
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentTaskData, setStudentTaskData] = useState<Task[]>([]);
  const [facultyTaskData, setFacultyTaskData] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [openCreateTaskModal, setOpenCreateTaskModal] = useState(false);
  useEffect(() => {
    if (open && role === "student") {
      setActiveView("student");
    }
  }, [open, role]);
  const loadStudentTasks = async () => {
    if (!studentId || !open) return;
    try {
      setIsLoadingTasks(true);
      const tasks = await fetchStudentTasksForLoggedInStudent(studentId);
      const mappedTasks = tasks.map((task: any) => ({
        facultyTaskId: task.studentTaskId,
        title: task.taskTitle,
        description: task.description,
        time: task.time,
        date: task.date
      }));
      setStudentTaskData(mappedTasks);
    } catch (error) {
      console.error("loadStudentTasks error:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  };
  useEffect(() => {
    if (role === "student") {
      loadStudentTasks();
    }
  }, [studentId, open, role]);
  const loadFacultyTasksForStudent = async () => {
    if (role !== "student" || !open || !collegeId || !collegeBranchId || !collegeAcademicYearId) return;
    try {
      setIsLoadingTasks(true);
      const today = new Date().toISOString().split("T")[0];
      const tasks = await fetchFacultyTasksForStudent({
        date: today,
        collegeId,
        collegeBranchId,
        collegeAcademicYearId,
        collegeSemesterId
      });
      const mappedTasks = tasks.map((task: any) => ({
        facultyTaskId: task.facultyTaskId,
        title: task.taskTitle,
        description: task.description,
        time: task.time,
        date: task.date
      }));
      setFacultyTaskData(mappedTasks);
    } catch (error) {
      console.error("loadFacultyTasksForStudent error:", error);
    } finally {
      setIsLoadingTasks(false);
    }
  };
  useEffect(() => {
    loadFacultyTasksForStudent();
  }, [role, open, collegeId, collegeBranchId, collegeAcademicYearId, collegeSemesterId]);
  if (!open) return null;
  const confirmDelete = (taskId: number) => {
    const {
      t
    } = useTranslation();
    Alert.alert(t("Delete Task"), t("Are you sure you want to delete this task?"), [{
      text: t("Cancel"),
      style: "cancel"
    }, {
      text: t("Delete"),
      style: "destructive",
      onPress: () => handleDelete(taskId)
    }]);
  };
  const handleDelete = async (taskId: number) => {
    const {
      t
    } = useTranslation();
    setIsDeleting(true);
    try {
      const res = role === "student" ? await deactivateStudentTask(taskId) : await deactivateFacultyTask(taskId);
      if (res.success) {
        await onDeleteTask?.(taskId);
        Toast.show({
          type: "success",
          text1: t("Task deleted successfully")
        });
        if (role === "student") {
          loadStudentTasks();
        } else {}
      } else {
        Toast.show({
          type: "error",
          text1: t("Failed to delete task")
        });
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: t("An error occurred while deleting")
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const tasksToShow = role === "faculty" ? [] : activeView === "student" ? studentTaskData : facultyTaskData;
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hourStr, minute] = time.split(":");
    let hour = Number(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };
  return <Modal visible={open} transparent animationType="slide">
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-[#F4F4F4] rounded-t-3xl h-[85%] overflow-hidden flex-col">
                    {}
                    <View className="bg-white border-b border-gray-200 px-5 py-4 flex-row items-center justify-between shrink-0">
                        <View className="flex-row items-center gap-3">
                            <View className="bg-[#E7F7EE] rounded-full p-1.5">
                                <CheckCircle size={22} weight="fill" color="#43C17A" />
                            </View>
                            <Text className="text-[#16284F] font-semibold text-lg">
                                {t("My Tasks")}
                            </Text>
                        </View>

                        <View className="flex-row items-center gap-3">
                            {(role === "faculty" || role === "student" && activeView === "student") && <TouchableOpacity onPress={() => setOpenCreateTaskModal(true)} className="flex-row items-center gap-2 px-3 py-1.5 rounded-full border border-[#43C17A]">
                                    <Text className="text-[#43C17A] text-xs font-bold">+ {t("Add Task")}</Text>
                                </TouchableOpacity>}

                            <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-gray-100">
                                <X size={22} color="#16284F" weight="bold" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {}
                    <View className="flex-1 px-4 pt-4 pb-10">
                        <View className="bg-white rounded-2xl shadow-sm p-4 flex-1">
                            <View className="flex-row justify-between items-center mb-4">
                                <View className="flex-row items-center">
                                    {role === "student" && <View className="flex-row items-center">
                                            <TouchableOpacity onPress={() => setActiveView("faculty")}>
                                                <Text className={`text-sm font-semibold ${activeView === "faculty" ? "text-[#16284F]" : "text-gray-400"}`}>
                                                    {t("Faculty Tasks")}
                                                </Text>
                                            </TouchableOpacity>
                                            <Text className="text-gray-300 mx-2">/</Text>
                                            <TouchableOpacity onPress={() => setActiveView("student")}>
                                                <Text className={`text-sm font-semibold ${activeView === "student" ? "text-[#16284F]" : "text-gray-400"}`}>
                                                    {t("My Tasks")}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>}

                                    {role === "faculty" && <Text className="text-[#282828] font-bold">
                                            {t("My Tasks")}
                                        </Text>}
                                </View>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                                {isLoadingTasks || loading ? <View className="py-10 items-center justify-center">
                                        <ActivityIndicator size="large" color="#43C17A" />
                                    </View> : tasksToShow.length === 0 ? <View className="py-10 items-center justify-center">
                                        <Text className="text-sm text-gray-400">
                                            {t("No tasks available")}
                                        </Text>
                                    </View> : tasksToShow.map(task => <View key={task.facultyTaskId} className="bg-[#E8F8EF] rounded-xl mb-3 p-3 flex-row justify-between">
                                            <View className="flex-1 pr-2">
                                                <Text className="text-sm font-bold text-[#16284F] mb-1">
                                                    {task.title}
                                                </Text>
                                                <Text className="text-xs text-[#454545]">
                                                    {task.description}
                                                </Text>
                                            </View>

                                            <View className="items-end justify-between min-w-[70px]">
                                                <Text className="text-xs font-bold text-[#6B7280]">
                                                    {formatTime(task.time)}
                                                </Text>

                                                <View className="flex-row gap-2 mt-2">
                                                    {(role === "faculty" || role === "student" && activeView === "student") && <>
                                                            <TouchableOpacity onPress={() => {
                        if (onEditTask) {
                          onEditTask(task);
                        } else {
                          setEditTask(task);
                          setOpenCreateTaskModal(true);
                        }
                      }} className="p-1.5 rounded-full bg-white/50">
                                                                <PencilSimple size={16} color="#16284F" weight="bold" />
                                                            </TouchableOpacity>

                                                            <TouchableOpacity onPress={() => confirmDelete(task.facultyTaskId)} className="p-1.5 rounded-full bg-red-100/50">
                                                                <Trash size={16} color="#EF4444" weight="bold" />
                                                            </TouchableOpacity>
                                                        </>}
                                                </View>
                                            </View>
                                        </View>)}
                            </ScrollView>
                        </View>
                    </View>
                </View>
            </View>

            {onSaveTask && <TaskModal open={openCreateTaskModal} role={role} collegeSubjectId={collegeSubjectId} facultyId={facultyId} studentId={studentId} defaultValues={editTask} onClose={() => {
      setOpenCreateTaskModal(false);
      setEditTask(null);
    }} onSave={async (payload, taskId) => {
      await onSaveTask(payload, taskId);
      if (role === "student") {
        await loadStudentTasks();
        await loadFacultyTasksForStudent();
      }
      setOpenCreateTaskModal(false);
    }} />}
        </Modal>;
}
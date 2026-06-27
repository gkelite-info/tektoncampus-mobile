import { useTranslation } from 'react-i18next';import { Text } from '@/components/AppText';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Linking } from 'react-native';
import { CaretLeft, FilePdf, Check, X, PencilSimple } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchAssignmentTableData } from '@/lib/helpers/faculty/assignment/fetchAssignmentTableData';
import { generateSubmissionSignedUrl } from '@/lib/helpers/faculty/assignment/generateSubmissionSignedUrl';
import { updateSubmissionEvaluation } from '@/lib/helpers/faculty/assignment/updateSubmissionEvaluation';

function formatDateInt(value: number | string) {
  if (!value || value === "-") return "-";
  const str = value.toString();
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
  }
  return str.includes("/") ? str : str;
}

type Status = "Evaluated" | "Pending" | "Not Submitted";

interface Row {
  id: number;
  name: string;
  roll: string;
  date?: string;
  file?: string;
  filePath?: string;
  marks?: string;
  feedback?: string;
  status: Status;
  submissionId?: number;
}

export default function AssignmentSubmissions() {const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { assignmentId } = route.params || {};

  const [rows, setRows] = useState<Row[]>([]);
  const [assignmentDetails, setAssignmentDetails] = useState<{dueDate: string;totalMarks: string;totalSubmissions: number;} | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | Status>("All");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempData, setTempData] = useState<{
    marks: string;
    feedback: string;
    status: Status;
  } | null>(null);

  useEffect(() => {
    if (assignmentId) {
      fetchDynamicData();
    }
  }, [assignmentId]);

  async function fetchDynamicData() {
    try {
      setLoading(true);
      const { assign, students, submissions } = await fetchAssignmentTableData(assignmentId);

      setAssignmentDetails({
        dueDate: assign?.submissionDeadlineInt ? String(assign.submissionDeadlineInt) : assign?.submissionDeadline || "-",
        totalMarks: assign?.marks ? String(assign.marks) : "-",
        totalSubmissions: submissions?.length || 0
      });

      const mergedRows: Row[] = (students || []).map((student: any) => {
        const sub = submissions?.find((s: any) => s.studentId === student.studentId);
        const user = student.users;

        const pinNumber = Array.isArray(student.student_pins) ?
        student.student_pins[0]?.pinNumber :
        student.student_pins?.pinNumber;

        return {
          id: student.studentId,
          name: user?.fullName || "Unknown",
          roll: pinNumber || "N/A",
          date: sub ?
          new Date(sub.submittedOn).toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric"
          }) :
          "-",
          file: sub?.file?.split("/").pop() || "-",
          filePath: sub?.file || null,
          marks: sub?.marksScored !== null && sub?.marksScored !== undefined ? `${sub.marksScored}` : "",
          feedback: sub?.feedback || "",
          status: sub ? sub.status === "Evaluated" ? "Evaluated" : "Pending" : "Not Submitted",
          submissionId: sub?.studentAssignmentSubmissionId
        };
      });
      setRows(mergedRows);
    } catch {
      Toast.show({ type: "error", text1: "Error loading submissions" });
    } finally {
      setLoading(false);
    }
  }

  const handleViewFile = async (filePath: string) => {
    try {
      const signedUrl = await generateSubmissionSignedUrl(filePath);
      if (signedUrl) Linking.openURL(signedUrl);
    } catch {
      Toast.show({ type: "error", text1: "Failed to open file" });
    }
  };

  const startEditing = (row: Row) => {
    if (!row.submissionId) {
      Toast.show({ type: "error", text1: "Student has not submitted." });
      return;
    }
    setEditingId(row.id);
    setTempData({ marks: row.marks || "", feedback: row.feedback || "", status: row.status });
  };

  const confirmSave = async () => {
    if (!editingId || !tempData) return;
    const row = rows.find((r) => r.id === editingId);
    if (!row?.submissionId) return;

    const { error } = await updateSubmissionEvaluation(row.submissionId, {
      marksScored: parseInt(tempData.marks) || 0,
      feedback: tempData.feedback,
      status: tempData.status as "Evaluated" | "Pending"
    });

    if (error) {
      Toast.show({ type: "error", text1: "Update failed" });
    } else {
      setRows((prev) => prev.map((r) => r.id === editingId ? { ...r, ...tempData } : r));
      Toast.show({ type: "success", text1: "Saved successfully" });
      setEditingId(null);
    }
  };

  const filtered = filter === "All" ? rows : rows.filter((r) => r.status === filter);

  const renderStudentCard = ({ item }: {item: Row;}) => {
    const isEditing = editingId === item.id;

    return (
      <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="text-base font-bold text-gray-800">{item.name}</Text>
            <Text className="text-sm font-semibold text-green-600">{item.roll}</Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${
          item.status === 'Evaluated' ? 'bg-[#E3F6EB]' :
          item.status === 'Pending' ? 'bg-[#FFF1E2]' : 'bg-gray-100'}`
          }>
            <Text className={`text-xs font-bold ${
            item.status === 'Evaluated' ? 'text-[#13934B]' :
            item.status === 'Pending' ? 'text-[#FFBB70]' : 'text-gray-500'}`
            }>{item.status}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between mt-1 mb-3">
          <Text className="text-xs text-gray-500">{t("Auto.Common.Submitted", "Submitted:")} {item.date}</Text>
          {item.filePath &&
          <TouchableOpacity onPress={() => handleViewFile(item.filePath!)} className="flex-row items-center gap-1 bg-red-50 px-2 py-1 rounded-md">
              <FilePdf size={16} color="#ef4444" weight="fill" />
              <Text className="text-xs text-red-500 font-medium max-w-[100px]" numberOfLines={1}>{item.file}</Text>
            </TouchableOpacity>
          }
        </View>

        {isEditing ?
        <View className="bg-gray-50 p-3 rounded-lg border border-gray-200 gap-3">
            <View className="flex-row items-center gap-3">
              <Text className="text-sm font-bold text-gray-700 w-16">{t("Auto.Common.Marks", "Marks:")}</Text>
              <TextInput
              value={tempData?.marks}
              onChangeText={(t) => setTempData({ ...tempData!, marks: t })}
              keyboardType="numeric"
              className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white" />
            
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-sm font-bold text-gray-700 w-16">{t("Auto.Common.Feedback", "Feedback:")}</Text>
              <TextInput
              value={tempData?.feedback}
              onChangeText={(t) => setTempData({ ...tempData!, feedback: t })}
              className="flex-1 border border-gray-300 rounded px-2 py-1 bg-white" />
            
            </View>
            <View className="flex-row items-center gap-3">
              <Text className="text-sm font-bold text-gray-700 w-16">{t("Auto.Common.Status", "Status:")}</Text>
              <View className="flex-1 flex-row gap-2">
                <TouchableOpacity
                onPress={() => setTempData({ ...tempData!, status: 'Evaluated' })}
                className={`px-2 py-1 rounded border ${tempData?.status === 'Evaluated' ? 'border-[#43C17A] bg-[#E7F7EE]' : 'border-gray-300 bg-white'}`}>
                
                  <Text className={`text-xs font-bold ${tempData?.status === 'Evaluated' ? 'text-[#43C17A]' : 'text-gray-500'}`}>{t("Auto.Common.Evaluated", "Evaluated")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                onPress={() => setTempData({ ...tempData!, status: 'Pending' })}
                className={`px-2 py-1 rounded border ${tempData?.status === 'Pending' ? 'border-[#FFBB70] bg-[#FFF1E2]' : 'border-gray-300 bg-white'}`}>
                
                  <Text className={`text-xs font-bold ${tempData?.status === 'Pending' ? 'text-[#FFBB70]' : 'text-gray-500'}`}>{t("Auto.Common.Pending", "Pending")}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View className="flex-row items-center justify-end gap-3 mt-2">
              <TouchableOpacity onPress={() => setEditingId(null)} className="px-3 py-1.5 rounded bg-gray-200">
                <Text className="text-sm font-bold text-gray-600">{t("Auto.Common.Cancel", "Cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSave} className="px-3 py-1.5 rounded bg-[#43C17A]">
                <Text className="text-sm font-bold text-white">{t("Auto.Common.Save", "Save")}</Text>
              </TouchableOpacity>
            </View>
          </View> :

        <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-gray-800">{t("Auto.Common.Marks", "Marks:")} <Text className="font-medium text-gray-600">{item.marks || '-'}</Text></Text>
              <Text className="text-xs font-bold text-gray-800 mt-1" numberOfLines={1}>{t("Auto.Common.Notes", "Notes:")} <Text className="font-medium text-gray-600 italic">{item.feedback || '-'}</Text></Text>
            </View>
            {item.status !== "Not Submitted" &&
          <TouchableOpacity onPress={() => startEditing(item)} className="p-2 rounded-full bg-gray-100">
                <PencilSimple size={16} color="#374151" />
              </TouchableOpacity>
          }
          </View>
        }
      </View>);

  };

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center gap-3 shadow-sm z-10 pt-12">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 rounded-full hover:bg-gray-100">
          <CaretLeft size={24} weight="bold" color="#16284F" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#16284F]">{t("Auto.Common.AssignmentSubmi", "Assignment Submissions")}</Text>
      </View>

      <View className="p-4 flex-1">
        {assignmentDetails &&
        <View className="mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-[#E2DAFF] rounded-xl p-3 items-center justify-center border border-[#D5CAFF] shadow-sm">
                <Text className="text-[10px] font-bold text-[#714EF2] uppercase mb-1 tracking-wider">{t("Auto.Common.DueDate", "Due Date")}</Text>
                <Text className="text-sm font-black text-[#282828]">{formatDateInt(assignmentDetails.dueDate)}</Text>
              </View>
              <View className="flex-1 bg-[#FFEDDA] rounded-xl p-3 items-center justify-center border border-[#FFDFBC] shadow-sm">
                <Text className="text-[10px] font-bold text-[#FF9E3D] uppercase mb-1 tracking-wider">{t("Auto.Common.TotalMarks", "Total Marks")}</Text>
                <Text className="text-sm font-black text-[#282828]">{assignmentDetails.totalMarks}</Text>
              </View>
              <View className="flex-1 bg-[#E6FBEA] rounded-xl p-3 items-center justify-center border border-[#BDECC9] shadow-sm">
                <Text className="text-[10px] font-bold text-[#43C17A] uppercase mb-1 tracking-wider">{t("Auto.Common.Submissions", "Submissions")}</Text>
                <Text className="text-sm font-black text-[#282828]">{assignmentDetails.totalSubmissions}</Text>
              </View>
            </View>
          </View>
        }

        <View className="flex-row gap-2 mb-4">
          {['All', 'Evaluated', 'Pending', 'Not Submitted'].map((f) =>
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f as any)}
            className={`px-3 py-1.5 rounded-full ${filter === f ? 'bg-[#43C17A]' : 'bg-white border border-gray-200'}`}>
            
              <Text className={`text-xs font-bold ${filter === f ? 'text-white' : 'text-gray-500'}`}>{f}</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ?
        <ActivityIndicator size="large" color="#43C17A" className="mt-10" /> :
        filtered.length === 0 ?
        <View className="items-center justify-center mt-10">
            <Text className="text-gray-500 font-semibold">{t("Auto.Common.Nosubmissionsfo", "No submissions found.")}</Text>
          </View> :

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudentCard}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false} />

        }
      </View>
    </View>);

}
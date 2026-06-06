import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, Linking, TextInput } from 'react-native';
import { CaretLeft, FilePdf, PencilSimple, Check, X } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { fetchDiscussionUploads, updateStudentDiscussionMarks } from '@/lib/helpers/discussionForum/discussionFileUploadsAPI';
import { fetchDiscussionById } from '@/lib/helpers/discussionForum/discussionForumAPI';

function formatFileName(url: string) {
  if (!url) return 'Document';
  return url.split('/').pop()?.split('_').slice(1).join('_') || 'Document';
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function DiscussionSubmissions() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { discussionId } = route.params || {};

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [discussionDetails, setDiscussionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [tempMarks, setTempMarks] = useState<string>('');

  useEffect(() => {
    if (!discussionId) return;

    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const [submissionsData, details] = await Promise.all([
          fetchDiscussionUploads(discussionId),
          fetchDiscussionById(discussionId)
        ]);
        if (cancelled) return;
        setSubmissions(submissionsData);
        setDiscussionDetails(details);
      } catch (err) {
        if (cancelled) return;
        Toast.show({ type: "error", text1: "Failed to fetch submissions" });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [discussionId]);

  const handleSaveMarks = async (studentId: number) => {
    const marks = parseInt(tempMarks);
    if (isNaN(marks)) {
      Toast.show({ type: "error", text1: "Please enter valid marks" });
      return;
    }
    try {
      const res = await updateStudentDiscussionMarks(studentId, discussionId, marks);
      if (res.success) {
        Toast.show({ type: "success", text1: "Marks updated" });
        setSubmissions(prev => prev.map(sub => sub.studentId === studentId ? { ...sub, marksObtained: marks } : sub));
        setEditingStudentId(null);
      } else {
        Toast.show({ type: "error", text1: "Failed to update marks" });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error updating marks" });
    }
  };

  const renderSubmissionCard = ({ item }: { item: any }) => {
    const isEditing = editingStudentId === item.studentId;

    return (
      <View className="bg-white rounded-xl p-4 flex-col gap-3 shadow-sm border border-gray-100 mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3 flex-1">
            <View className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
              {item.profiles?.avatar_url ? (
                <Image source={{ uri: item.profiles.avatar_url }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Image source={require('../../../../../assets/icon.png')} style={{ width: '100%', height: '100%' }} />
              )}
            </View>
            <View className="flex-col flex-1 pr-2">
              <Text className="text-sm font-bold text-[#43C17A]" numberOfLines={1}>{item.profiles?.full_name || "Unknown"}</Text>
              <Text className="text-xs text-gray-500">ID: {item.profiles?.rollNumber || item.studentId}</Text>
              <Text className="text-[10px] text-gray-500">Section: {item.profiles?.section || "N/A"}</Text>
            </View>
          </View>

          <View className="items-end">
            {isEditing ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={tempMarks}
                  onChangeText={setTempMarks}
                  keyboardType="numeric"
                  className="border border-gray-300 rounded px-2 py-1 w-12 text-center text-xs"
                />
                <Text className="text-xs font-bold text-gray-500">/ {item.totalMarks}</Text>
                <TouchableOpacity onPress={() => handleSaveMarks(item.studentId)} className="bg-[#43C17A] p-1 rounded">
                  <Check size={14} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingStudentId(null)} className="bg-gray-200 p-1 rounded">
                  <X size={14} color="#374151" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => {
                  setTempMarks(item.marksObtained != null ? String(item.marksObtained) : '');
                  setEditingStudentId(item.studentId);
                }}
                className="bg-[#16284F] px-3 py-1.5 rounded-md flex-row items-center gap-1"
              >
                <Text className="text-xs font-bold text-white">
                  {item.marksObtained != null ? `${item.marksObtained} / ${item.totalMarks}` : "Add Marks"}
                </Text>
                <PencilSimple size={12} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="border-t border-gray-100 pt-3 flex-col gap-2">
          <Text className="text-[10px] text-gray-500 font-bold">Files uploaded:</Text>
          <View className="flex-row flex-wrap gap-2">
            {item.files?.map((file: any) => (
              <TouchableOpacity 
                key={file.id} 
                onPress={() => Linking.openURL(file.url)}
                className="flex-row items-center gap-1 bg-red-50 px-2 py-1.5 rounded-md border border-red-100"
              >
                <FilePdf size={14} color="#ef4444" weight="fill" />
                <Text className="text-[10px] text-red-500 font-medium max-w-[120px]" numberOfLines={1}>
                  {formatFileName ? formatFileName(file.url) : file.url.split('/').pop()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-[10px] text-gray-400 self-end mt-1">Submitted: {formatDate(item.submittedAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F4F4F4]">
      <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center gap-3 shadow-sm z-10 pt-12">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1 rounded-full hover:bg-gray-100">
          <CaretLeft size={24} weight="bold" color="#16284F" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#16284F]">Discussion Submissions</Text>
        </View>
      </View>

      <View className="p-4 flex-1">
        {discussionDetails && (
          <View className="mb-4">
            <View className="flex-row gap-3">
              <View className="flex-1 bg-[#E2DAFF] rounded-xl p-3 items-center justify-center border border-[#D5CAFF] shadow-sm">
                <Text className="text-[10px] font-bold text-[#714EF2] uppercase mb-1 tracking-wider">Due Date</Text>
                <Text className="text-sm font-black text-[#282828]">{formatDate(discussionDetails.deadline)}</Text>
              </View>
              <View className="flex-1 bg-[#FFEDDA] rounded-xl p-3 items-center justify-center border border-[#FFDFBC] shadow-sm">
                <Text className="text-[10px] font-bold text-[#FF9E3D] uppercase mb-1 tracking-wider">Total Marks</Text>
                <Text className="text-sm font-black text-[#282828]">
                  {discussionDetails.discussion_forum_sections?.[0]?.marks || "-"}
                </Text>
              </View>
              <View className="flex-1 bg-[#E6FBEA] rounded-xl p-3 items-center justify-center border border-[#BDECC9] shadow-sm">
                <Text className="text-[10px] font-bold text-[#43C17A] uppercase mb-1 tracking-wider">Submissions</Text>
                <Text className="text-sm font-black text-[#282828]">{submissions.length}</Text>
              </View>
            </View>
          </View>
        )}

        {isLoading ? (
          <ActivityIndicator size="large" color="#43C17A" className="mt-10" />
        ) : submissions.length === 0 ? (
          <View className="items-center justify-center mt-10">
            <Text className="text-gray-500 font-semibold">No submissions yet.</Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={item => item.studentId.toString()}
            renderItem={renderSubmissionCard}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

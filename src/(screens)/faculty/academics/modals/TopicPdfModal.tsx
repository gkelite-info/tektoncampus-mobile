import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Linking } from 'react-native';
import { CaretLeft, UploadSimple, FilePdf, Trash, Eye } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import { useUser } from '@/utils/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchTopicResources, 
  saveTopicResource, 
  deactivateTopicResource,
  TopicResourceRow 
} from '@/lib/helpers/faculty/Savetopicresource';
import { Buffer } from 'buffer';

type TopicPdfModalProps = {
  visible: boolean;
  onClose: () => void;
  topicId: number;
  topicTitle: string;
  unitLabel: string;
  unitTitle: string;
};

export default function TopicPdfModal({ visible, onClose, topicId, topicTitle, unitLabel, unitTitle }: TopicPdfModalProps) {
  const { userId, collegeId, role } = useUser();
  const [resources, setResources] = useState<TopicResourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (visible && topicId) {
      loadResources();
    }
  }, [visible, topicId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await fetchTopicResources(topicId);
      setResources(data);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load PDFs" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (asset.size && asset.size > 10 * 1024 * 1024) {
        Toast.show({ type: "error", text1: "File size must be less than 10MB" });
        return;
      }

      setUploading(true);

      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
      const pdfBuffer = Buffer.from(base64, 'base64');

      const isAdminNum = role === "admin" ? 1 : 0;
      const createdByNum = Number(userId);

      await saveTopicResource({
        pdfBuffer,
        topicTitle,
        collegeSubjectUnitTopicId: topicId,
        collegeId: collegeId as number,
        createdBy: createdByNum,
        isAdmin: isAdminNum,
      });

      Toast.show({ type: "success", text1: "PDF uploaded successfully" });
      await loadResources();
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to upload PDF", text2: err?.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId: number) => {
    try {
      setDeletingId(resourceId);
      const res = await deactivateTopicResource(resourceId);
      if (res.success) {
        setResources(prev => prev.filter(r => r.collegeSubjectUnitTopicResourceId !== resourceId));
        Toast.show({ type: "success", text1: "Deleted successfully" });
      } else {
        Toast.show({ type: "error", text1: "Failed to delete PDF" });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Error deleting PDF" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (url: string) => {
    Linking.openURL(url).catch(() => {
      Toast.show({ type: "error", text1: "Could not open URL" });
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#F4F4F4]">
        <View className="bg-white px-4 py-4 border-b border-gray-200 flex-row items-center justify-between shadow-sm z-10 pt-5">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <CaretLeft size={24} weight="bold" color="#16284F" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-[#16284F]">Topic Resources</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 100 }}>
           
          {/* Header context */}
          <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex-col gap-2 shadow-sm">
            <View className="flex-row items-center gap-2">
               <View className="h-2 w-2 rounded-full bg-[#A66BFF]" />
               <Text className="text-xs text-[#7E5DFF] font-semibold">{unitLabel} • {unitTitle}</Text>
            </View>
            <Text className="text-[#282828] font-bold text-lg">{topicTitle}</Text>
          </View>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[#282828] font-bold text-base">Uploaded PDFs</Text>
            <TouchableOpacity 
               onPress={handleUpload}
               disabled={uploading}
               className={`flex-row items-center gap-2 px-3 py-2 rounded-lg ${uploading ? 'bg-[#7E5DFF]/50' : 'bg-[#7E5DFF]'}`}
            >
               {uploading ? (
                 <ActivityIndicator size="small" color="white" />
               ) : (
                 <>
                   <UploadSimple size={16} weight="bold" color="white" />
                   <Text className="text-white font-bold text-xs">Upload</Text>
                 </>
               )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#7E5DFF" className="mt-10" />
          ) : resources.length === 0 ? (
            <View className="items-center justify-center mt-10 bg-white p-8 rounded-xl border border-gray-100">
              <FilePdf size={48} color="#cbd5e1" weight="duotone" />
              <Text className="text-gray-500 font-semibold mt-4">No PDFs uploaded yet</Text>
              <Text className="text-gray-400 text-xs mt-1 text-center">Click upload to add study materials for this topic</Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {resources.map((resource) => (
                <View key={resource.collegeSubjectUnitTopicResourceId} className="bg-white border border-gray-200 rounded-xl p-3 flex-row items-center justify-between shadow-sm">
                  <View className="flex-row items-center gap-3 flex-1 mr-4">
                    <View className="bg-[#E9E3FF] p-2 rounded-lg">
                      <FilePdf size={24} color="#7E5DFF" weight="duotone" />
                    </View>
                    <View className="flex-col flex-1">
                      <Text className="text-sm font-semibold text-[#282828]" numberOfLines={1}>
                        {resource.resourceName}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity 
                      onPress={() => handleView(resource.resourceUrl)}
                      className="p-2 bg-gray-100 rounded-lg"
                    >
                      <Eye size={18} color="#4b5563" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDelete(resource.collegeSubjectUnitTopicResourceId)}
                      disabled={deletingId === resource.collegeSubjectUnitTopicResourceId}
                      className="p-2 bg-red-50 rounded-lg"
                    >
                      {deletingId === resource.collegeSubjectUnitTopicResourceId ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Trash size={18} color="#ef4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      </View>
    </Modal>
  );
}

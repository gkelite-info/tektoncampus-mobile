import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Linking } from 'react-native';
import { X, Trash, UploadSimple, FilePdf, ArrowSquareOut } from 'phosphor-react-native';
import Toast from 'react-native-toast-message';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

import { useUser } from '@/utils/context/UserContext';
import { 
  fetchTopicResources, 
  saveTopicResource, 
  deactivateTopicResource,
  TopicResourceRow 
} from '@/lib/helpers/faculty/Savetopicresource';

type StagedFile = {
  id: string;
  uri: string;
  previewName: string;
  sizeLabel: string;
};

type TopicPdfModalProps = {
  visible: boolean;
  onClose: () => void;
  topicId: number;
  topicTitle: string;
  unitLabel: string;
  unitTitle: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TopicPdfModal({ visible, onClose, topicId, topicTitle, unitLabel, unitTitle }: TopicPdfModalProps) {
  const { userId, collegeId, role } = useUser();
  const [savedResources, setSavedResources] = useState<TopicResourceRow[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible && topicId) {
      loadResources();
    } else {
      setStagedFiles([]);
    }
  }, [visible, topicId]);

  const loadResources = async () => {
    try {
      setLoadingResources(true);
      const data = await fetchTopicResources(topicId);
      setSavedResources(data);
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to load PDFs" });
    } finally {
      setLoadingResources(false);
    }
  };

  const handleBrowseFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const newStaged: StagedFile[] = [];
      for (const asset of result.assets) {
        if (asset.size && asset.size > 10 * 1024 * 1024) {
          Toast.show({ type: "error", text1: `File ${asset.name} is too large (>10MB)` });
          continue;
        }
        newStaged.push({
          id: `staged-${asset.name}-${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          previewName: asset.name,
          sizeLabel: asset.size ? formatSize(asset.size) : "Unknown size",
        });
      }

      setStagedFiles(prev => [...prev, ...newStaged]);
    } catch (err) {
      Toast.show({ type: "error", text1: "Error picking files" });
    }
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);

    const isAdminNum = role === "admin" ? 1 : 0;
    const createdByNum = Number(userId);
    let successCount = 0;

    for (const staged of stagedFiles) {
      try {
        const base64 = await FileSystem.readAsStringAsync(staged.uri, { encoding: 'base64' });
        const pdfBuffer = decode(base64);

        await saveTopicResource({
          pdfBuffer: pdfBuffer as any,
          topicTitle: staged.previewName.replace('.pdf', ''),
          collegeSubjectUnitTopicId: topicId,
          collegeId: collegeId as number,
          createdBy: createdByNum,
          isAdmin: isAdminNum,
        });
        successCount++;
      } catch (err: any) {
        Toast.show({ type: "error", text1: `Failed: ${staged.previewName}` });
      }
    }

    if (successCount > 0) {
      Toast.show({ type: "success", text1: `${successCount} file(s) uploaded successfully` });
    }
    
    setStagedFiles([]);
    setIsUploading(false);
    await loadResources();
  };

  const handleDeleteSaved = async (resourceId: number) => {
    try {
      setDeletingIds(prev => new Set(prev).add(resourceId));
      const res = await deactivateTopicResource(resourceId);
      if (res.success) {
        setSavedResources(prev => prev.filter(r => r.collegeSubjectUnitTopicResourceId !== resourceId));
        Toast.show({ type: "success", text1: "Resource deleted" });
      } else {
        Toast.show({ type: "error", text1: "Failed to delete PDF" });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Error deleting PDF" });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(resourceId);
        return next;
      });
    }
  };

  const handleView = (url: string) => {
    Linking.openURL(url).catch(() => {
      Toast.show({ type: "error", text1: "Could not open URL" });
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 justify-center items-center p-4">
        <View className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90%] flex-col overflow-hidden relative">
          
          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-4 right-4 z-10 p-1"
          >
            <X size={20} weight="bold" color="#9ca3af" />
          </TouchableOpacity>

          <ScrollView className="px-6 py-6" contentContainerStyle={{ paddingBottom: 20 }}>
            {}
            <Text className="text-base font-semibold text-gray-800 pr-6 flex-row flex-wrap leading-6 mb-5">
              <Text className="text-[#7E5DFF]">{unitLabel}</Text>
              <Text className="text-gray-400"> → </Text>
              <Text className="text-gray-700">{unitTitle}</Text>
              <Text className="text-gray-400"> → </Text>
              <Text className="text-gray-700">{topicTitle}</Text>
            </Text>

            <Text className="text-sm font-semibold text-gray-700 mb-2">Upload</Text>

            {}
            <TouchableOpacity 
              onPress={handleBrowseFiles}
              className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl items-center justify-center py-8 mb-6"
            >
              <View className="bg-white rounded-full p-3 shadow-sm mb-2">
                <UploadSimple size={28} color="#9ca3af" weight="bold" />
              </View>
              <Text className="text-sm text-gray-500 mb-2">Tap here to select PDF files</Text>
              <View className="px-5 py-1.5 border border-gray-300 rounded-md bg-white">
                <Text className="text-sm text-gray-600">Browse Files</Text>
              </View>
            </TouchableOpacity>

            {}
            {stagedFiles.length > 0 && (
              <View className="mb-6">
                <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Ready to upload ({stagedFiles.length})
                </Text>
                <View className="flex-col gap-2">
                  {stagedFiles.map((f) => (
                    <View key={f.id} className="flex-row items-center justify-between bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
                      <View className="flex-row items-center gap-3 flex-1 mr-2">
                        <View className="bg-red-100 rounded-lg p-1.5">
                          <FilePdf size={20} color="#ef4444" weight="duotone" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>{f.previewName}</Text>
                          <Text className="text-xs text-gray-400">{f.sizeLabel}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeStagedFile(f.id)}
                        disabled={isUploading}
                        className="p-1"
                      >
                        <Trash size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {}
            {savedResources.length > 0 && (
              <View>
                <Text className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                  Uploaded ({savedResources.length})
                </Text>
                <View className="flex-col gap-2">
                  {savedResources.map((r) => {
                    const isDeleting = deletingIds.has(r.collegeSubjectUnitTopicResourceId);
                    return (
                      <View key={r.collegeSubjectUnitTopicResourceId} className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                        <View className="flex-row items-center gap-3 flex-1 mr-2">
                          <View className="bg-red-100 rounded-lg p-1.5">
                            <FilePdf size={20} color="#ef4444" weight="duotone" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-700" numberOfLines={1}>{r.resourceName}</Text>
                            <Text className="text-xs text-gray-400">PDF</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <TouchableOpacity onPress={() => handleView(r.resourceUrl)} className="p-1">
                            <ArrowSquareOut size={18} color="#9ca3af" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => handleDeleteSaved(r.collegeSubjectUnitTopicResourceId)}
                            disabled={isDeleting}
                            className="p-1"
                          >
                            {isDeleting ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <Trash size={18} color="#ef4444" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
            
            {loadingResources && (
              <ActivityIndicator size="large" color="#43C17A" className="my-4" />
            )}
          </ScrollView>

          {}
          <View className="flex-row gap-3 px-6 pb-6 pt-3 border-t border-gray-100">
            <TouchableOpacity 
              onPress={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 items-center justify-center"
            >
              <Text className="text-sm font-medium text-gray-600">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleUpload}
              disabled={isUploading || stagedFiles.length === 0}
              className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center gap-2 ${
                isUploading || stagedFiles.length === 0 ? "bg-[#43C17A]/50" : "bg-[#43C17A]"
              }`}
            >
              {isUploading && <ActivityIndicator size="small" color="white" />}
              <Text className="text-sm font-semibold text-white">
                {isUploading ? "Uploading..." : `Upload File${stagedFiles.length > 1 ? "s" : ""}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Trash, PencilSimpleLine, FilePdf, Eye } from 'phosphor-react-native';
import { fonts } from "@/constants/fonts";
import { AttachmentViewerModal } from "@/(screens)/student/assignments/components/studentDiscussionModals";
import Toast from 'react-native-toast-message';
import { getLabManualPublicUrl } from '@/lib/helpers/faculty/facultyLabManualHelper';

export interface LabManual {
  labId: number;
  labTitle: string;
  subjectName?: string;
  sectionName?: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  uploadedAt: string;
  pdfUrl?: string;
}

interface FacultyLabCardProps {
  data: LabManual;
  onDelete?: (labId: number) => void;
  onEdit?: (lab: LabManual) => void;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB');
}

export default function FacultyLabCard({ data, onDelete, onEdit }: FacultyLabCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  const handleView = async () => {
    if (isLoadingUrl) return;

    if (data.pdfUrl) {
      if (data.pdfUrl.startsWith('http')) {
        setViewerUrl(data.pdfUrl);
      } else {
        setIsLoadingUrl(true);
        try {
          const url = await getLabManualPublicUrl(data.pdfUrl);
          if (url) {
            setViewerUrl(url);
          } else {
            Toast.show({ type: 'error', text1: 'Failed to generate view link' });
          }
        } catch (err) {
          console.error("Error viewing lab manual:", err);
          Toast.show({ type: 'error', text1: 'Failed to view lab manual' });
        } finally {
          setIsLoadingUrl(false);
        }
      }
    } else if (data.fileUrl) {
      setViewerUrl(data.fileUrl);
    } else {
      Toast.show({ type: 'error', text1: 'No document URL available' });
    }
  };

  return (
    <View className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
      <View className="flex-row items-center gap-3 w-full">
        <View className="w-12 h-12 rounded-lg bg-[#FFF4F4] border border-[#FECACA] items-center justify-center shrink-0">
          <Text className="text-[10px] text-[#EF4444] tracking-widest" style={{ fontFamily: fonts.bold }}>PDF</Text>
          <View className="w-5 h-0.5 bg-[#EF4444] mt-1 rounded-full" />
        </View>

        <View className="flex-1">
          <Text className="text-base text-gray-900 leading-tight" numberOfLines={1} style={{ fontFamily: fonts.bold }}>
            {data.labTitle}
          </Text>

          <View className="flex-row items-center gap-2 mt-1.5 flex-wrap">
            {data.subjectName && (
              <View className="bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                <Text className="text-[10px] text-gray-600" style={{ fontFamily: fonts.bold }}>{data.subjectName}</Text>
              </View>
            )}
            {data.sectionName && (
              <View className="bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                <Text className="text-[10px] text-gray-600" style={{ fontFamily: fonts.bold }}>Sec: {data.sectionName}</Text>
              </View>
            )}
          </View>

          {data.description && (
            <Text className="text-xs text-gray-500 mt-2" numberOfLines={2} style={{ fontFamily: fonts.regular }}>
              {data.description}
            </Text>
          )}

          <View className="flex-row flex-wrap items-center gap-2 mt-2">
            <Text className="text-[11px] text-gray-500" numberOfLines={1} style={{ fontFamily: fonts.medium }}>
              📄 {data.fileName}
            </Text>
            <Text className="text-[11px] text-gray-400" style={{ fontFamily: fonts.regular }}>• {formatFileSize(data.fileSize)}</Text>
            <Text className="text-[11px] text-gray-400" style={{ fontFamily: fonts.regular }}>• Uploaded {formatDate(data.uploadedAt)}</Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-end gap-3 pt-3 mt-3 border-t border-gray-100">
        {(data.fileUrl || data.pdfUrl) && (
          <TouchableOpacity
            onPress={handleView}
            disabled={isLoadingUrl}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100"
          >
            {isLoadingUrl ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Eye size={14} color="#059669" weight="bold" />
            )}
            <Text className="text-[#059669] text-xs" style={{ fontFamily: fonts.bold }}>
              {isLoadingUrl ? 'Loading...' : 'View'}
            </Text>
          </TouchableOpacity>
        )}

        {onEdit && !showConfirm && (
          <TouchableOpacity
            onPress={() => onEdit(data)}
            className="w-8 h-8 items-center justify-center rounded-lg bg-blue-50 border border-blue-100"
          >
            <PencilSimpleLine size={16} color="#2563EB" weight="bold" />
          </TouchableOpacity>
        )}

        {onDelete && !showConfirm && (
          <TouchableOpacity
            onPress={() => setShowConfirm(true)}
            className="w-8 h-8 items-center justify-center rounded-lg bg-red-50 border border-red-100"
          >
            <Trash size={16} color="#EF4444" weight="bold" />
          </TouchableOpacity>
        )}

        {showConfirm && (
          <View className="flex-row items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
            <Text className="text-[10px] text-red-600 uppercase" style={{ fontFamily: fonts.bold }}>Delete?</Text>
            <TouchableOpacity onPress={() => { onDelete?.(data.labId); setShowConfirm(false); }} className="bg-red-500 px-2 py-1 rounded">
              <Text className="text-white text-[10px]" style={{ fontFamily: fonts.bold }}>YES</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowConfirm(false)} className="px-1.5">
              <Text className="text-gray-500 text-[10px]" style={{ fontFamily: fonts.bold }}>NO</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <AttachmentViewerModal
        visible={!!viewerUrl}
        url={viewerUrl || ""}
        onClose={() => setViewerUrl(null)}
      />
    </View>
  );
}

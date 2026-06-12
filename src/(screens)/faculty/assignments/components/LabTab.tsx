import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabaseServer';
import { fetchLabManualsForStaff, deleteLabManual, getLabManualPublicUrl } from '@/lib/helpers/faculty/facultyLabManualHelper';
import FacultyLabCard, { LabManual } from './FacultyLabCard';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import FacultyLabForm from './FacultyLabForm';
import AssignmentSkeleton from '../shimmer/AssignmentShimmer';
import { useTranslation } from 'react-i18next';

export default function LabTab() {
  const { t } = useTranslation();
  const [labs, setLabs] = useState<LabManual[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingLab, setEditingLab] = useState<any>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLabs = async () => {
    setIsLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('userId')
        .eq('auth_id', auth.user.id)
        .single();

      if (!userData) return;

      const { data: facultyData } = await supabase
        .from('faculty')
        .select('facultyId')
        .eq('userId', userData.userId)
        .single();

      if (!facultyData) return;

      let data: any[] = [];
      try {
        const res = await fetchLabManualsForStaff({
          facultyId: facultyData.facultyId,
          page: 1,
          pageSize: 100,
        });
        data = res.data;
      } catch (err: any) {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Failed to fetch lab manuals' });
        return;
      }

      if (data) {
        const enriched = data.map((lab: any) => {
          return {
            labId: lab.labManualId,
            labTitle: lab.labTitle,
            subjectName: lab.college_subjects?.subjectName,
            sectionName: lab.college_sections?.collegeSections,
            description: lab.description,
            fileName: lab.pdfUrl ? lab.pdfUrl.split('/').pop() : 'Document',
            fileSize: lab.fileSize || 0,
            fileUrl: lab.pdfUrl && lab.pdfUrl.startsWith('http') ? lab.pdfUrl : undefined,
            uploadedAt: lab.createdAt,
            // Keep original IDs for editing
            collegeSubjectId: lab.collegeSubjectId,
            collegeAcademicYearId: lab.collegeAcademicYearId,
            collegeSectionsId: lab.collegeSectionsId,
            pdfUrl: lab.pdfUrl,
          };
        });
        setLabs(enriched);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const executeDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteLabManual(deleteId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Lab manual deleted successfully' });
        loadLabs();
      } else {
        Toast.show({ type: 'error', text1: 'Failed to delete lab manual' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete lab manual' });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (lab: any) => {
    setEditingLab(lab);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingLab(null);
    setShowForm(true);
  };

  const handleSaveForm = () => {
    setShowForm(false);
    loadLabs();
  };

  if (showForm) {
    return (
      <View style={{ flex: 1 }}>
        <FacultyLabForm
          initialData={editingLab}
          onSaved={handleSaveForm}
          onCancel={() => setShowForm(false)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Add Button */}
      <TouchableOpacity
        className="bg-[#16284F] rounded-lg py-3 items-center mb-4 mt-2"
        onPress={handleAdd}
      >
        <Text className="text-white font-bold">{t('Upload Lab Manual')}</Text>
      </TouchableOpacity>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View className="mt-4">
            <AssignmentSkeleton />
          </View>
        ) : labs.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            {t('No lab manuals found')}
          </Text>
        ) : (
          labs.map((lab, index) => (
            <FacultyLabCard
              key={index}
              data={lab}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
            />
          ))
        )}
      </ScrollView>

      {deleteId !== null && (
        <ConfirmDeleteModal
          open={true}
          isDeleting={isDeleting}
          name="lab manual"
          onCancel={() => {
            if (!isDeleting) setDeleteId(null);
          }}
          onConfirm={executeDelete}
        />
      )}
    </View>
  );
}

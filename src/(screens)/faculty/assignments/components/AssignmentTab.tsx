import { Text } from '@/components/AppText';
import { fonts } from '@/constants/fonts';
import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabaseServer';
import { fetchFacultyAssignments } from '@/lib/helpers/faculty/assignment/fetchFacultyAssignments';
import { deleteFacultyAssignment } from '@/lib/helpers/faculty/assignment/deleteFacultyAssignment';
import AssignmentCard, { Assignment } from './AssignmentCard';
import AssignmentSkeleton from '../shimmer/AssignmentShimmer';
import AssignmentForm from './AssignmentForm';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

export default function AssignmentTab() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'active' | 'previous'>('active');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadAssignments = async (page: number, view: 'active' | 'previous') => {
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

      const dbStatus = view === 'active' ? 'Active' : 'Evaluated';

      const { data, count, error } = await fetchFacultyAssignments(
        facultyData.facultyId,
        dbStatus,
        page,
        ITEMS_PER_PAGE
      );

      if (error) {
        Toast.show({ type: 'error', text1: 'Failed to fetch assignments' });
        return;
      }

      if (data) {
        const formatted: Assignment[] = data.map((a: any) => ({
          sectionId: a.collegeSectionsId,
          assignmentId: a.assignmentId,
          image: '/assignment.jpg',
          title: a.college_subjects?.subjectName || 'Unknown Subject',
          description: a.topicName,
          fromDate: a.dateAssignedInt,
          toDate: a.submissionDeadlineInt,
          totalSubmitted: String(a.actualSubmissionsCount || 0),
          totalSubmissions: String(a.expectedStudentsCount || 0),
          marks: a.marks ? String(a.marks) : '0',
        }));
        
        if (page === 1) {
          setAssignments(formatted);
        } else {
          setAssignments(prev => [...prev, ...formatted]);
        }
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments(1, activeView);
    setCurrentPage(1);
  }, [activeView]);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteFacultyAssignment(id);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Assignment deleted' });
        loadAssignments(1, activeView);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to delete: ' + res.error });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Failed to delete' });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingAssignment(null);
    setShowForm(true);
  };

  const handleSaveForm = () => {
    setShowForm(false);
    loadAssignments(1, activeView); 
  };

  if (showForm) {
    return (
      <View style={{ flex: 1 }}>
        <AssignmentForm
          initialData={editingAssignment}
          onSave={handleSaveForm}
          onCancel={() => setShowForm(false)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {}
      <View className="flex-row border-b border-gray-200 mb-4">
        <TouchableOpacity
          onPress={() => setActiveView('active')}
          className={`flex-1 items-center py-3 ${activeView === 'active' ? 'border-b-2 border-[#43C17A]' : ''}`}
        >
          <Text className={`${activeView ==='active' ? 'text-[#43C17A]' : 'text-gray-500'}`} style={{ fontFamily: fonts.bold }}>
            {t('Active Assignments')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView('previous')}
          className={`flex-1 items-center py-3 ${activeView === 'previous' ? 'border-b-2 border-[#43C17A]' : ''}`}
        >
          <Text className={`${activeView ==='previous' ? 'text-[#43C17A]' : 'text-gray-500'}`} style={{ fontFamily: fonts.bold }}>
            {t('Evaluated Assignments')}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      {activeView === 'active' && (
        <TouchableOpacity
          className="bg-[#16284F] rounded-lg py-3 items-center mb-4"
          onPress={handleAdd}
        >
          <Text className="text-white" style={{ fontFamily: fonts.bold }}>{t('Add Assignment')}</Text>
        </TouchableOpacity>
      )}

      {}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading && currentPage === 1 ? (
          <View className="mt-4">
            <AssignmentSkeleton />
          </View>
        ) : assignments.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10" style={{ fontFamily: fonts.regular }}>
            {t('No assignments found')}
          </Text>
        ) : (
          <AssignmentCard
            cardProp={assignments}
            activeView={activeView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

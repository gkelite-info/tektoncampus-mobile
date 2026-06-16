import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabaseServer';
import { fetchDiscussionsByFacultyId, fetchCompletedDiscussionsByFacultyId, deactivateDiscussionForum } from '@/lib/helpers/discussionForum/discussionForumAPI';
import FacultyDiscussionCard from './FacultyDiscussionCard';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import FacultyDiscussionForm from './FacultyDiscussionForm';
import AssignmentSkeleton from '../shimmer/AssignmentShimmer';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

export default function DiscussionTab() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [activeView, setActiveView] = useState<'active' | 'completed'>('active');
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingDiscussionId, setEditingDiscussionId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDiscussions = async (view: 'active' | 'completed') => {
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
        if (view === 'active') {
          const result = await fetchDiscussionsByFacultyId(facultyData.facultyId, 1, 100);
          data = result.data;
        } else {
          const result = await fetchCompletedDiscussionsByFacultyId(facultyData.facultyId, 1, 100);
          data = result.data;
        }
      } catch (err: any) {
        console.error(err);
        Toast.show({ type: 'error', text1: 'Failed to fetch discussions' });
        return;
      }

      if (data) {
        setDiscussions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussions(activeView);
  }, [activeView]);

  const executeDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deactivateDiscussionForum(deleteId);
      if (res.success) {
        Toast.show({ type: 'success', text1: 'Discussion deleted successfully' });
        loadDiscussions(activeView);
      } else {
        Toast.show({ type: 'error', text1: 'Failed to delete discussion' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to delete discussion' });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (id: number) => {
    setEditingDiscussionId(id);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingDiscussionId(null);
    setShowForm(true);
  };

  const handleSaveForm = (id: number) => {
    setShowForm(false);
    loadDiscussions(activeView);
  };

  if (showForm) {
    return (
      <View style={{ flex: 1 }}>
        <FacultyDiscussionForm
          discussionId={editingDiscussionId ?? undefined}
          isEditMode={!!editingDiscussionId}
          onSaved={handleSaveForm}
          onCancel={() => setShowForm(false)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {}
      <View className="flex-row border-b border-gray-200 mb-4 bg-white rounded-lg p-1 shadow-sm mx-1">
        <TouchableOpacity
          onPress={() => setActiveView('active')}
          className={`flex-1 items-center py-2 rounded-md ${activeView === 'active' ? 'bg-[#43C17A]' : ''}`}
        >
          <Text className={`font-bold ${activeView === 'active' ? 'text-white' : 'text-gray-500'}`}>
            {t('Active')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveView('completed')}
          className={`flex-1 items-center py-2 rounded-md ${activeView === 'completed' ? 'bg-[#43C17A]' : ''}`}
        >
          <Text className={`font-bold ${activeView === 'completed' ? 'text-white' : 'text-gray-500'}`}>
            {t('Evaluated')}
          </Text>
        </TouchableOpacity>
      </View>

      {}
      {activeView === 'active' && (
        <TouchableOpacity
          className="bg-[#16284F] rounded-lg py-3 items-center mb-4"
          onPress={handleAdd}
        >
          <Text className="text-white font-bold">{t('Create Discussion')}</Text>
        </TouchableOpacity>
      )}

      {}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View className="mt-4">
            <AssignmentSkeleton />
          </View>
        ) : discussions.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            {t('No discussions found')}
          </Text>
        ) : (
          discussions.map((disc, index) => (
            <FacultyDiscussionCard
              key={index}
              data={disc}
              discussionView={activeView}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteId(id)}
              onViewSubmissions={(id) => navigation.navigate('DiscussionSubmissions', { discussionId: id })}
            />
          ))
        )}
      </ScrollView>

      {deleteId !== null && (
        <ConfirmDeleteModal
          open={true}
          isDeleting={isDeleting}
          name="discussion"
          onCancel={() => {
            if (!isDeleting) setDeleteId(null);
          }}
          onConfirm={executeDelete}
        />
      )}
    </View>
  );
}

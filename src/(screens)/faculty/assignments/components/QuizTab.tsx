import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { supabase } from '@/lib/supabaseServer';
import { fetchQuizzesByStatus, updateQuizStatus, deactivateQuiz } from '@/lib/helpers/quiz/quizAPI';
import FacultyQuizCard from './FacultyQuizCard';
import QuizSkeleton from '../shimmer/QuizShimmer';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import FacultyQuizForm from './FacultyQuizForm';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 10;

export default function QuizTab() {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'Draft' | 'Active' | 'Completed'>('Active');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteQuizId, setDeleteQuizId] = useState<number | null>(null);
  const [isDeletingQuiz, setIsDeletingQuiz] = useState(false);

  const loadQuizzes = async (page: number, view: 'Draft' | 'Active' | 'Completed') => {
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
      let totalCountVal = 0;
      try {
        const res = await fetchQuizzesByStatus(
          facultyData.facultyId,
          view,
          page,
          ITEMS_PER_PAGE
        );
        data = res.data;
        totalCountVal = res.totalCount;
      } catch (err: any) {
        console.error(err);
        Toast.show({ type: 'error', text1: t('Failed to fetch quizzes') });
        return;
      }

      if (data) {
        const formatted = data.map((q: any) => ({
          quizId: q.quizId,
          title: q.quizTitle,
          subtitle: q.college_subjects?.subjectName || 'Unknown Subject',
          duration: `${q.durationMinutes} mins`,
          totalQuestions: String(q.questionsCount || 0),
          totalMarks: String(q.totalMarks || 0),
          status: q.status,
        }));
        
        if (page === 1) {
          setQuizzes(formatted);
        } else {
          setQuizzes(prev => [...prev, ...formatted]);
        }
        setTotalCount(totalCountVal || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes(1, activeView);
    setCurrentPage(1);
  }, [activeView]);

  const executeDeleteQuiz = async () => {
    if (!deleteQuizId) return;
    setIsDeletingQuiz(true);
    try {
      const res = await deactivateQuiz(deleteQuizId);
      if (res.success) {
        Toast.show({ type: 'success', text1: t('Quiz deleted successfully') });
        loadQuizzes(1, activeView);
      } else {
        Toast.show({ type: 'error', text1: t('Failed to delete quiz') });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: t('Failed to delete quiz') });
    } finally {
      setIsDeletingQuiz(false);
      setDeleteQuizId(null);
    }
  };

  const handlePublishQuiz = async (quizId: number) => {
    const res = await updateQuizStatus(quizId, 'Active');
    if (res.success) {
      Toast.show({ type: 'success', text1: t('Quiz published successfully') });
      loadQuizzes(1, activeView);
    } else {
      Toast.show({ type: 'error', text1: t('Failed to publish quiz') });
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);

  const handleEdit = (quizId: number) => {
    setEditingQuizId(quizId);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingQuizId(null);
    setShowForm(true);
  };

  const handleSaveForm = (quizId: number) => {
    setShowForm(false);
    loadQuizzes(1, activeView);
    Toast.show({ type: 'info', text1: t('Next step: Add Questions to Quiz ID ') + quizId });
  };

  if (showForm) {
    return (
      <View style={{ flex: 1 }}>
        <FacultyQuizForm
          quizId={editingQuizId ?? undefined}
          isEditMode={!!editingQuizId}
          onSaved={handleSaveForm}
          onCancel={() => setShowForm(false)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-row border-b border-gray-200 mb-4 bg-white rounded-lg p-1 shadow-sm mx-1">
        {(['Draft', 'Active', 'Completed'] as const).map((view) => (
          <TouchableOpacity
            key={view}
            onPress={() => setActiveView(view)}
            className={`flex-1 items-center py-2 rounded-md ${activeView === view ? 'bg-[#43C17A]' : ''}`}
          >
            <Text className={`font-bold ${activeView === view ? 'text-white' : 'text-gray-500'}`}>
              {t(view)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {['Draft', 'Active'].includes(activeView) && (
        <TouchableOpacity
          className="bg-[#16284F] rounded-lg py-3 items-center mb-4"
          onPress={handleAdd}
        >
          <Text className="text-white font-bold">{t('Create Quiz')}</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading && currentPage === 1 ? (
          <View className="mt-4">
            <QuizSkeleton />
          </View>
        ) : quizzes.length === 0 ? (
          <Text className="text-center text-gray-500 mt-10">
            {t('No quizzes found')}
          </Text>
        ) : (
          quizzes.map((quiz, index) => (
            <FacultyQuizCard
              key={index}
              data={quiz}
              onEdit={activeView === 'Draft' ? handleEdit : undefined}
              onDelete={activeView !== 'Completed' ? () => setDeleteQuizId(quiz.quizId) : undefined}
              onPublish={activeView === 'Draft' ? handlePublishQuiz : undefined}
              onViewSubmissions={() => Toast.show({ type: 'info', text1: t('View submissions functionality to be implemented') })}
            />
          ))
        )}
      </ScrollView>

      {deleteQuizId !== null && (
        <ConfirmDeleteModal
          open={true}
          isDeleting={isDeletingQuiz}
          name="quiz"
          onCancel={() => {
            if (!isDeletingQuiz) setDeleteQuizId(null);
          }}
          onConfirm={executeDeleteQuiz}
        />
      )}
    </View>
  );
}

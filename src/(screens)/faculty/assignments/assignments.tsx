import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTranslation } from 'react-i18next';
import AssignmentTab from './components/AssignmentTab';
import QuizTab from './components/QuizTab';
import DiscussionTab from './components/DiscussionTab';
import LabTab from './components/LabTab';

export type MainTabType = 'assignments' | 'quiz' | 'discussion' | 'lab';

export default function FacultyAssignments() {
  const { t } = useTranslation();
  const headerHeight = useHeaderHeight();
  const [activeTab, setActiveTab] = useState<MainTabType>('assignments');

  const tabs: { key: MainTabType; label: string }[] = [
    { key: 'assignments', label: t('Assignments') },
    { key: 'quiz', label: t('Quiz') },
    { key: 'discussion', label: t('Discussion forum') },
    { key: 'lab', label: t('Lab') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ flex: 1, paddingTop: headerHeight + 16, paddingHorizontal: 16 }}>
        {/* Header Text */}
        <View className="mb-3 mt-0">
          <Text className="font-bold text-2xl mb-1 text-[#282828]">
            {activeTab === 'assignments' && t('Assignments')}
            {activeTab === 'quiz' && t('Quiz')}
            {activeTab === 'discussion' && t('Discussion forum')}
            {activeTab === 'lab' && t('Lab')}
          </Text>
          <Text className="text-[#282828] text-sm">
            {activeTab === 'assignments' && t('Create, manage, and evaluate assignments for your students efficiently.')}
            {activeTab === 'quiz' && t('Design, organize, and publish quizzes to assess your students effectively.')}
            {activeTab === 'discussion' && t('Create and manage project discussions for students.')}
            {activeTab === 'lab' && t('Upload and manage lab manuals for your students.')}
          </Text>
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 20, paddingBottom: 8 }}
            style={{ borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 16 }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={{
                    paddingBottom: 8,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? '#43C17A' : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: isActive ? '#43C17A' : '#6B7280',
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1 }}>
          {activeTab === 'assignments' && <AssignmentTab />}
          {activeTab === 'quiz' && <QuizTab />}
          {activeTab === 'discussion' && <DiscussionTab />}
          {activeTab === 'lab' && <LabTab />}
        </View>
      </View>
    </View>
  );
}

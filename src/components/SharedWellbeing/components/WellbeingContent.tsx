import React, { useState } from 'react';
import { View } from 'react-native';
import TopCards from './TopCards';
import IssueList from './IssueList';
import IssueForm from './IssueForm';
import { useUser } from '@/utils/context/UserContext';
import type { StudentWellbeingIssueListItem } from '@/lib/helpers/wellbeingSupportIssues/types';

interface WellbeingContentProps {
  role: string;
}

export default function WellbeingContent({ role }: WellbeingContentProps) {
  const [currentTab, setCurrentTab] = useState<string>("raised");
  const [editingIssue, setEditingIssue] = useState<StudentWellbeingIssueListItem | null>(null);
  const [isRaisingNew, setIsRaisingNew] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // In a real implementation you might fetch user loading states here
  // const { loading } = useUser();

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    setEditingIssue(null);
    setIsRaisingNew(false);
  };

  const showForm = isRaisingNew || editingIssue !== null;

  return (
    <View className="flex-1 px-4 py-2">
      <TopCards currentTab={currentTab} onTabChange={handleTabChange} refreshTrigger={refreshTrigger} />
      
      {!showForm ? (
        <IssueList 
          currentTab={currentTab} 
          onRaiseIssue={() => setIsRaisingNew(true)}
          onEditIssue={setEditingIssue}
          onDeleteComplete={() => setRefreshTrigger(prev => prev + 1)}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <IssueForm
          editingIssue={editingIssue}
          onCancelEdit={() => setEditingIssue(null)}
          onEditComplete={() => {
            setEditingIssue(null);
            setRefreshTrigger(prev => prev + 1);
          }}
          onCancelNew={() => setIsRaisingNew(false)}
          onSuccess={() => {
            setIsRaisingNew(false);
            setRefreshTrigger(prev => prev + 1);
          }}
          role={role}
        />
      )}
    </View>
  );
}

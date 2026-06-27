import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text } from '@/components/AppText';
import { IssueListShimmer } from './shimmers/WellbeingShimmers';
import { Plus } from 'phosphor-react-native';
import IssueCard from './IssueCard';
import { Pagination } from '@/components/pagination';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/utils/context/UserContext';
import { fetchStudentWellbeingIssues, deleteWellbeingSupportIssue } from '@/lib/helpers/wellbeingSupportIssues/wellbeingSupportIssueAPI';
import Toast from 'react-native-toast-message';
import type { StudentWellbeingIssueListItem } from '@/lib/helpers/wellbeingSupportIssues/types';

interface IssueListProps {
  currentTab: string;
  onRaiseIssue: () => void;
  onEditIssue: (issue: StudentWellbeingIssueListItem) => void;
  onDeleteComplete?: () => void;
  refreshTrigger?: number;
}

export default function IssueList({ currentTab, onRaiseIssue, onEditIssue, onDeleteComplete, refreshTrigger = 0 }: IssueListProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<StudentWellbeingIssueListItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 3;

  const { userId, collegeId } = useUser();

  const loadIssues = useCallback(async () => {
    if (!userId || !collegeId) return;
    setLoading(true);
    try {
      const result = await fetchStudentWellbeingIssues({
        userId: Number(userId),
        collegeId: Number(collegeId),
        page: currentPage,
        limit: itemsPerPage,
        tab: currentTab as any,
      });
      setIssues(result.data);
      setTotalItems(result.totalCount);
    } catch (e) {
      setIssues([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [currentTab, currentPage, userId, collegeId, refreshTrigger]);

  useEffect(() => {
    // Reset to page 1 when tab changes
    setCurrentPage(1);
  }, [currentTab]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  const handleDelete = async (issue: StudentWellbeingIssueListItem) => {
    if (!userId || !collegeId) return;
    Alert.alert(
      t('Wellbeing_module.common.DeleteIssue', 'Delete Issue'),
      t('Wellbeing_module.common.DeleteConfirm', 'Are you sure you want to delete this issue?'),
      [
        {
          text: t('Wellbeing_module.common.Cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('Wellbeing_module.common.Delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWellbeingSupportIssue({
                wellbeingSupportIssueId: Number(issue.id),
                createdBy: Number(userId),
                collegeId: Number(collegeId),
              });
              Toast.show({ type: 'success', text1: t('Wellbeing_module.common.DeleteSuccess', 'Wellbeing issue deleted successfully.') });
              loadIssues();
              onDeleteComplete?.();
            } catch (error) {
              Toast.show({ type: 'error', text1: t('Wellbeing_module.common.DeleteFailed', 'Failed to delete wellbeing issue.') });
            }
          },
        },
      ]
    );
  };

  const showActions = currentTab === "raised" || currentTab === "pending";

  return (
    <View className="flex-1 mt-4">
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-lg font-bold text-[#16284F] capitalize">
          {t(`Wellbeing_module.common.${currentTab}`, currentTab)} {t('Wellbeing_module.common.Issues', 'Issues')}
        </Text>
        <TouchableOpacity
          onPress={onRaiseIssue}
          className="flex-row items-center bg-[#43C17A] px-3 py-2 rounded-lg shadow-sm"
        >
          <Plus size={16} weight="bold" color="white" />
          <Text className="text-white font-medium ml-1 text-sm">
            {t('Wellbeing_module.common.RaiseIssue', 'Raise Issue')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <IssueListShimmer />
      ) : (
        <View className="flex-1 min-h-[300px]">
          {issues.length > 0 ? (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                showActions={showActions}
                onEdit={onEditIssue}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-10">
              <Text className="text-gray-500">
                {t('Wellbeing_module.common.NoIssuesFound', 'No issues found.')}
              </Text>
            </View>
          )}

          <View className="mt-2 mb-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </View>
        </View>
      )}
    </View>
  );
}

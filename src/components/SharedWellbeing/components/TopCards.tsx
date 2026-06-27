import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '@/components/AppText';
import { TopCardsShimmer } from './shimmers/WellbeingShimmers';
import { Warning } from 'phosphor-react-native';
import { wellbeingCards } from '../data';
import { useTranslation } from 'react-i18next';
import { fetchStudentWellbeingIssueCounts } from "@/lib/helpers/wellbeingSupportIssues/wellbeingSupportIssueAPI";
import { useUser } from '@/utils/context/UserContext';

interface TopCardsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  refreshTrigger?: number;
}

export default function TopCards({ currentTab, onTabChange, refreshTrigger = 0 }: TopCardsProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({
    raised: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
  });

  const { userId, collegeId } = useUser();

  const loadCounts = useCallback(async () => {
    if (!userId || !collegeId) return;
    setLoading(true);
    try {
      const nextCounts = await fetchStudentWellbeingIssueCounts(Number(userId), Number(collegeId));
      setCounts(nextCounts as any);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [userId, collegeId, refreshTrigger]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const formatCount = (count: number, pad = false) =>
    pad ? String(count).padStart(2, '0') : String(count);

  if (loading) {
    return <TopCardsShimmer />;
  }

  const dynamicCards = wellbeingCards.map((card) => ({
    ...card,
    value: card.id === 'raised'
      ? formatCount(counts.raised)
      : formatCount(counts[card.id as keyof typeof counts], true),
  }));

  return (
    <View className="flex-row flex-wrap justify-between mb-4">
      {dynamicCards.map((card) => {
        const isActive = currentTab === card.id;

        return (
          <TouchableOpacity
            key={card.id}
            onPress={() => onTabChange(card.id)}
            style={{
              width: '48%',
              backgroundColor: isActive ? card.iconColor : card.bg,
              borderColor: isActive ? card.iconColor : 'transparent',
              borderWidth: 2,
            }}
            className={`p-4 rounded-xl mb-3 shadow-sm`}
          >
            <View className="flex-row justify-between items-center mb-3">
              <View 
                style={{ backgroundColor: '#FFFFFF' }}
                className="w-8 h-8 rounded-md items-center justify-center"
              >
                <Warning
                  size={18}
                  weight="fill"
                  color={card.iconColor}
                />
              </View>
              <Text
                style={{ color: isActive ? '#FFFFFF' : card.iconColor }}
                className="text-xl font-bold"
              >
                {card.value}
              </Text>
            </View>
            <Text
              style={{ color: isActive ? '#FFFFFF' : '#282828' }}
              className="text-sm font-semibold"
            >
              {t(`Wellbeing_module.common.${card.label.replace(/\s+/g, '')}`, card.label)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

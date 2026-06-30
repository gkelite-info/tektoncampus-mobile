import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useParent } from '@/providers/ParentProvider';
import SharedAttendanceDashboard from '../../student/attendance/SharedAttendanceDashboard';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/AppText';

export default function ParentAttendance() {
  const { t } = useTranslation();
  const { childUserId, loading } = useParent();
  const headerHeight = useHeaderHeight();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: headerHeight + 16 }}>
        <ActivityIndicator size="large" color="#604DDC" />
      </View>
    );
  }

  if (!childUserId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: headerHeight + 16, backgroundColor: '#f4f5f6' }}>
        <Text className="text-gray-500 font-medium">{t("Dashboard.parent.Student Not Found", "Student Not Found")}</Text>
      </View>
    );
  }

  return <SharedAttendanceDashboard targetUserId={childUserId} />;
}
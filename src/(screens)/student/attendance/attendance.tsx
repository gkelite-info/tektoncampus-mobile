import React from 'react';
import { useUser } from '@/utils/context/UserContext';
import SharedAttendanceDashboard from './SharedAttendanceDashboard';
import { DashboardSkeleton } from './shimmer/attendanceDashSkeleton';

export default function StudentAttendanceScreen() {
  const { userId, loading } = useUser();

  if (loading || !userId) {
    return <DashboardSkeleton />;
  }

  return <SharedAttendanceDashboard targetUserId={userId} />;
}

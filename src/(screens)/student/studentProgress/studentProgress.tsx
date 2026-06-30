import React from 'react';
import { useUser } from '@/utils/context/UserContext';
import SharedStudentProgress from './SharedStudentProgress';
import { StudentProgressSkeleton } from './shimmer/studentProgressSkeleton';

export default function StudentProgressScreen() {
  const { userId, loading } = useUser();

  if (loading || !userId) {
    return <StudentProgressSkeleton />;
  }

  return <SharedStudentProgress targetUserId={userId} />;
}

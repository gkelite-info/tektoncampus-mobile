import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useParent } from "@/providers/ParentProvider";
import { fetchStudentContext } from "@/utils/context/student/studentContextAPI";
import SharedMeetings from "@/components/SharedMeetings/SharedMeetings";

export default function ParentMeetingsPage() {
  const { parentId, childUserId, loading: parentLoading } = useParent();
  const [childDetails, setChildDetails] = useState<{
    collegeBranchId: number | null;
    collegeSectionsId: number | null;
    collegeAcademicYearId: number | null;
  }>({
    collegeBranchId: null,
    collegeSectionsId: null,
    collegeAcademicYearId: null,
  });
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    if (!childUserId) {
      setLoadingContext(false);
      return;
    }
    const loadChildDetails = async () => {
      try {
        const student = await fetchStudentContext(childUserId);
        if (student) {
          setChildDetails({
            collegeBranchId: student.collegeBranchId,
            collegeSectionsId: student.collegeSectionsId,
            collegeAcademicYearId: student.collegeAcademicYearId,
          });
        }
      } catch (err) {
        console.error("Failed to fetch child student details", err);
      } finally {
        setLoadingContext(false);
      }
    };
    loadChildDetails();
  }, [childUserId]);

  if (parentLoading || loadingContext) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#604DDC" />
      </View>
    );
  }

  // We pass the exact payload the query expects
  const fetchParams = {
    collegeBranchId: childDetails.collegeBranchId,
    collegeSectionsId: childDetails.collegeSectionsId,
    collegeAcademicYearId: childDetails.collegeAcademicYearId,
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <SharedMeetings mode="Parent" fetchParams={fetchParams} />
    </View>
  );
}

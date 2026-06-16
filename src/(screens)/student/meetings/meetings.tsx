import React from "react";
import { useUser } from "@/utils/context/UserContext";
import { useStudent } from "@/utils/context/student/useStudent";
import SharedMeetings from "@/components/SharedMeetings/SharedMeetings";

export default function StudentMeetingsPage() {
  const { collegeBranchCode } = useUser();
  const { collegeSectionsId, college_sections } = useStudent();

  return (
    <SharedMeetings
      mode="Student"
      fetchParams={{
        collegeBranchCode,
        collegeSectionsId: Number(collegeSectionsId),
        college_sections,
      }}
    />
  );
}

import React from "react";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import SharedMeetings from "@/components/SharedMeetings/SharedMeetings";

export default function FacultyMeetingsPage() {
  const { collegeBranchId, sectionIds, academicYearIds } = useFaculty();

  return (
    <SharedMeetings
      mode="Faculty"
      fetchParams={{ collegeBranchId, sectionIds, academicYearIds }}
    />
  );
}

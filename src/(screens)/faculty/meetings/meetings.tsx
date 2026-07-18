import React from "react";
import { useFaculty } from "@/utils/context/faculty/useFaculty";
import { useUser } from "@/utils/context/UserContext";
import SharedMeetings from "@/components/SharedMeetings/SharedMeetings";

export default function FacultyMeetingsPage() {
  const { collegeBranchId, sectionIds, academicYearIds } = useFaculty();
  const { collegeEducationType } = useUser();

  return (
    <SharedMeetings
      mode="Faculty"
      fetchParams={{ collegeBranchId, sectionIds, academicYearIds }}
      collegeEducationType={collegeEducationType}
    />
  );
}

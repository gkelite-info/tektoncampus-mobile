import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { fetchStudentContext } from '@/utils/context/student/studentContextAPI';
import { getStudentRollNo } from '@/lib/helpers/identifiers/upsertIdentifier';

export function useTargetStudentDetails(targetUserId: number | null) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    userId: targetUserId,
    studentId: null,
    fullName: null,
    profilePhoto: null,
    identifierId: null,
    collegeEducationType: null,
    collegeBranchCode: null,
    collegeAcademicYear: null,
    college_sections: null,
    collegeSemester: null,
  });

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (!targetUserId) {
        if (mounted) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch User (for fullName)
        const { data: userData } = await supabase
          .from('users')
          .select('fullName')
          .eq('userId', targetUserId)
          .maybeSingle();

        // Fetch Profile Photo
        let profilePhotoUrl = null;
        try {
           const photoData = await supabase
             .from("user_profile")
             .select("profileUrl")
             .eq("userId", targetUserId)
             .eq("is_deleted", false)
             .maybeSingle();
           profilePhotoUrl = photoData?.data?.profileUrl || null;
        } catch(e) {}

        // Fetch Student Context
        const studentCtx = await fetchStudentContext(targetUserId);

        // Fetch Student Identifier (PIN / Roll No)
        let identifierId = null;
        try {
           if (studentCtx?.studentId && studentCtx?.collegeId) {
             identifierId = await getStudentRollNo(studentCtx.studentId, studentCtx.collegeId);
           }
        } catch (e) {
           console.error("Could not fetch identifier", e);
        }

        if (mounted) {
          setData({
            userId: targetUserId,
            studentId: studentCtx?.studentId || null,
            fullName: userData?.fullName || null,
            profilePhoto: profilePhotoUrl || null,
            identifierId: identifierId || null,
            collegeEducationType: studentCtx?.collegeEducationType || null,
            collegeBranchCode: studentCtx?.collegeBranchCode || null,
            collegeAcademicYear: studentCtx?.collegeAcademicYear || null,
            college_sections: studentCtx?.collegeSections || null,
            collegeSemester: studentCtx?.collegeSemester || null,
          });
        }
      } catch (e) {
        console.error('Error fetching target student details:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [targetUserId]);

  return {
    ...data,
    loading,
    userLoading: loading,
    studentLoading: loading,
  };
}

const { createClient } = require('@supabase/supabase-js');
const { getAdminStudentProgressDetails } = require('./src/lib/helpers/admin/studentProgress/getAdminStudentProgressDetails');

const supabaseUrl = 'https://wieinzdarxemefrzitog.supabase.co';
const supabaseAnonKey = 'sb_publishable_-VUXRd-6K5HRh7HZhqWaew_VM7U2gQc';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugQuery() {
    try {
        const studentId = 57; // Vamshid
        
        const { data: student } = await supabase
            .from('students')
            .select('studentId, collegeId, collegeBranchId, collegeEducationId, collegeBranch:collegeBranchId(collegeBranchCode)')
            .eq('studentId', studentId)
            .single();

        const { data: studentPinRow } = await supabase
            .from("student_pins")
            .select("pinNumber")
            .eq("studentId", studentId)
            .eq("isActive", true)
            .is("deletedAt", null)
            .maybeSingle();

        console.log('Pin Row:', studentPinRow);

        const { data: history } = await supabase
            .from("student_academic_history")
            .select("collegeSemesterId, collegeAcademicYearId, collegeSectionsId")
            .eq("studentId", studentId)
            .eq("isCurrent", true)
            .is("deletedAt", null)
            .single();

        if (studentPinRow && studentPinRow.pinNumber) {
            const adminAlignedDetails = await getAdminStudentProgressDetails({
                rollNo: studentPinRow.pinNumber,
                collegeId: student.collegeId,
                collegeEducationId: student.collegeEducationId,
                collegeBranchIds: [student.collegeBranchId],
                academicYearIds: [history.collegeAcademicYearId],
                semesterIds: history.collegeSemesterId ? [history.collegeSemesterId] : [],
                sectionIds: [history.collegeSectionsId],
                subjectIds: [78], // English - I
                departmentLabel: student.collegeBranch?.collegeBranchCode,
            });

            console.log('Admin Aligned Details:', JSON.stringify(adminAlignedDetails, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

debugQuery();

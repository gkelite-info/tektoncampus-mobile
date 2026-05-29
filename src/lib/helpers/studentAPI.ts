import { supabase } from "../supabaseClient";

export const getStudentId = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("userId, role")
        .eq("auth_id", auth.user.id)
        .single();

    if (userError || !user) {
        console.error("User not found", userError);
        return null;
    }

    if (user.role === 'Student') {
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("studentId")
            .eq("userId", user.userId)
            .single();

        if (studentError || !student) {
            console.error("Student not found", studentError);
            return null;
        }

        return student.studentId;
    }

};
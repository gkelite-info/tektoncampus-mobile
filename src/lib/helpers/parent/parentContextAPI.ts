import { supabase } from "@/lib/supabaseClient";

export type ParentJoin = {
    parentId: number;
    userId: number;
    studentId: number;
    collegeId: number;
    isActive: boolean;
    is_deleted: boolean;
    user: {
        fullName: string;
        email: string;
        mobile: string;
        gender: string;
    };
    college: {
        collegeName: string;
        collegeCode: string;
    };
    student: {
        college_education: {
            collegeEducationType: string;
        };
    } | null;
};

export async function fetchParentContext(userId: number) {
    const { data: parent, error: parentError } = await supabase
        .from("parents")
        .select(`
            parentId,
            userId,
            studentId,
            collegeId,
            isActive,
            is_deleted,
            user:userId!inner (
                fullName,
                email,
                mobile,
                gender
            ),
            college:collegeId (
                collegeCode
            ),
            student:studentId (
                college_education:collegeEducationId (
                    collegeEducationType
                )
            )
        `)
        .eq("userId", userId)
        .is("deletedAt", null)
        .maybeSingle();

    if (parentError) throw parentError;
    return parent as unknown as ParentJoin;
}

export async function fetchParentContextAdmin(params: {
    userId?: number;
    parentId?: number;
}) {
    let query = supabase
        .from("parents")
        .select(`*, user:userId(fullName, email)`)
        .is("deletedAt", null);

    if (params.userId) query = query.eq("userId", params.userId);
    if (params.parentId) query = query.eq("parentId", params.parentId);

    const { data: parent, error } = await query.single();
    if (error) throw error;

    return parent;
}

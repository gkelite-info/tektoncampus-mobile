import { supabase } from "@/lib/supabaseClient";

const ROLE_MAP: Record<
  string,
  { table: string; idCol: string; eduCol?: string; branchCol?: string }
> = {
  student: {
    table: "students",
    idCol: "studentId",
    eduCol: "collegeEducationId",
    branchCol: "collegeBranchId",
  },
  parent: { table: "parents", idCol: "parentId" },
  faculty: {
    table: "faculty",
    idCol: "facultyId",
    eduCol: "collegeEducationId",
    branchCol: "collegeBranchId",
  },
  admin: { table: "admins", idCol: "adminId", eduCol: "collegeEducationId" },
  finance_manager: {
    table: "finance_manager",
    idCol: "financeManagerId",
    eduCol: "collegeEducationId",
  },
  collegeadmin: { table: "college_admin", idCol: "collegeAdminId" },
  hr: { table: "college_hr", idCol: "collegeHrId" },
  placement: { table: "users", idCol: "userId" },
};

export async function sendEmailLocally({
  collegeId,
  audience,
  manualEmail,
  filters,
  cc,
  subject,
  description,
  senderName,
  senderAddress,
  senderUserId,
}: any) {
  try {
    let targetUsers: { userId: number; email: string }[] = [];
    let validUserIds: number[] | null = null;

    const hasAcademicFilters = !!(
      filters.edu ||
      filters.branch ||
      filters.year ||
      filters.sem ||
      filters.sec
    );

    if (audience) {
      const roleKey = audience.toLowerCase().replace(/\s/g, "");

      if (hasAcademicFilters) {
        if (roleKey === "student" || roleKey === "parent") {
          let studentQ = supabase
            .from("students")
            .select("userId, studentId")
            .eq("collegeId", collegeId);

          if (filters.edu) studentQ = studentQ.eq("collegeEducationId", filters.edu);
          if (filters.branch) studentQ = studentQ.eq("collegeBranchId", filters.branch);

          if (filters.year || filters.sem || filters.sec) {
            let histQ = supabase
              .from("student_academic_history")
              .select("studentId")
              .eq("isCurrent", true);
            if (filters.year) histQ = histQ.eq("collegeAcademicYearId", filters.year);
            if (filters.sem) histQ = histQ.eq("collegeSemesterId", filters.sem);
            if (filters.sec) histQ = histQ.eq("collegeSectionsId", filters.sec);

            const { data: histData } = await histQ;
            studentQ = studentQ.in(
              "studentId",
              (histData as any[])?.map((h) => h.studentId) || []
            );
          }

          const { data: stuData } = await studentQ;

          if (roleKey === "student") {
            validUserIds = (stuData as any[])?.map((s) => s.userId) || [];
          } else if (roleKey === "parent") {
            const validStudentIds = (stuData as any[])?.map((s) => s.studentId) || [];
            if (validStudentIds.length > 0) {
              const { data: parentData } = await supabase
                .from("parents")
                .select("userId")
                .in("studentId", validStudentIds);
              validUserIds = (parentData as any[])?.map((p) => p.userId) || [];
            } else {
              validUserIds = [];
            }
          }
        } else if (ROLE_MAP[roleKey] && roleKey !== "placement") {
          const config = ROLE_MAP[roleKey];
          let roleQuery = supabase
            .from(config.table)
            .select(`userId, ${config.idCol}`)
            .eq("collegeId", collegeId);

          if (filters.edu && config.eduCol)
            roleQuery = roleQuery.eq(config.eduCol, filters.edu);
          if (filters.branch && config.branchCol)
            roleQuery = roleQuery.eq(config.branchCol, filters.branch);

          if (roleKey === "faculty" && (filters.year || filters.sec)) {
            let secQ = supabase
              .from("faculty_sections")
              .select("facultyId")
              .eq("isActive", true);
            if (filters.year) secQ = secQ.eq("collegeAcademicYearId", filters.year);
            if (filters.sec) secQ = secQ.eq("collegeSectionsId", filters.sec);
            const { data: secData } = await secQ;
            roleQuery = roleQuery.in(
              "facultyId",
              (secData as any[])?.map((f) => f.facultyId) || []
            );
          }

          const { data: permitted } = await roleQuery;
          validUserIds = (permitted as any[])?.map((u) => u.userId) || [];
        }
      }

      let userQuery = supabase
        .from("users")
        .select("userId, email")
        .eq("collegeId", collegeId)
        .eq("role", audience);

      if (validUserIds !== null) {
        if (validUserIds.length === 0) return { success: true, count: 0, message: "No matching users found." };
        userQuery = userQuery.in("userId", validUserIds);
      }

      const { data: usersData } = await userQuery;
      if (usersData) targetUsers = [...targetUsers, ...(usersData as any[])];
    }

    if (manualEmail) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("userId, email")
        .eq("email", manualEmail)
        .maybeSingle();
      targetUsers.push(existingUser ? (existingUser as any) : { userId: 0, email: manualEmail });
    }

    const uniqueUsers = Array.from(
      new Map(targetUsers.map((item) => [item.email, item])).values()
    );
    if (uniqueUsers.length === 0) throw new Error("No recipients found.");

    
    const realUserIds = uniqueUsers.map((u) => u.userId).filter((id) => id !== 0);
    let preferences: any[] = [];

    if (realUserIds.length > 0) {
      const { data: prefData } = await supabase
        .from("user_preferences")
        .select("userId, email_alerts")
        .in("userId", realUserIds);
      if (prefData) preferences = prefData;
    }

    const now = new Date().toISOString();

    const queueData = uniqueUsers
      .filter((u) => u.userId !== 0)
      .map((user) => {
        const userPref = preferences.find((p) => p.userId === user.userId);
        const wantsEmail = userPref ? userPref.email_alerts !== false : true;

        return {
          userId: wantsEmail ? user.userId : senderUserId, 
          email: user.email,
          subject,
          body: description,
          status: "pending",
          isRead: wantsEmail ? false : true,
          createdAt: now,
          updatedAt: now,
          senderName: senderName || "System Notifications",
          senderAddress: senderAddress || "noreply@tektoncampus.edu",
        };
      });

    if (queueData.length > 0) {
      const { error: dbError } = await supabase.from("email_queue").insert(queueData);
      if (dbError) throw dbError;
    }

    const optedInUsersForResend = uniqueUsers.filter((user) => {
      if (user.userId === 0) return true;
      const userPref = preferences.find((p) => p.userId === user.userId);
      return userPref ? userPref.email_alerts !== false : true;
    });

    const ccArray = cc ? cc.split(",").map((e: string) => e.trim()) : [];
    const BATCH_SIZE = 100;

    const emailPayloads = optedInUsersForResend.map((u) => ({
      from: "Tekton Campus <vamshivadla@gkeliteinfo.com>",
      to: [u.email],
      cc: ccArray,
      subject,
      html: description,
    }));

    const chunks: (typeof emailPayloads)[] = [];
    for (let i = 0; i < emailPayloads.length; i += BATCH_SIZE) {
      chunks.push(emailPayloads.slice(i, i + BATCH_SIZE));
    }

    const resendKey = process.env.EXPO_PUBLIC_RESEND_API_KEY;
    if (!resendKey) {
        console.warn("EXPO_PUBLIC_RESEND_API_KEY is missing. Mocking the API call for testing.");
    } else {
        for (const chunk of chunks) {
            const response = await fetch("https://api.resend.com/emails/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${resendKey}`,
                },
                body: JSON.stringify(chunk),
            });
            
            if (!response.ok) {
                const errBody = await response.text();
                console.error("Resend API Error:", errBody);
                throw new Error("Failed to send email via Resend");
            }
        }
    }

    return { success: true, count: optedInUsersForResend.length };
  } catch (error: any) {
    console.error("API Error:", error);
    throw error;
  }
}

import { supabase } from "@/lib/supabaseClient";

export async function fetchLeaveChatHistory(
  studentLeaveId: number,
  page: number = 1,
  limit: number = 50,
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("leave_request_chats")
    .select(
      `
      *,
      students:senderStudentId ( users:userId ( fullName, user_profile(profileUrl) ) ),
      faculty:senderFacultyId ( users:userId ( fullName, user_profile(profileUrl) ) )
    `,
    )
    .eq("studentLeaveId", studentLeaveId)
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (error) throw error;

  return (data || []).reverse().map((msg: any) => formatChatMessage(msg));
}

export async function fetchSingleChatMessage(chatId: number) {
  const { data, error } = await supabase
    .from("leave_request_chats")
    .select(
      `
      *,
      students:senderStudentId ( users:userId ( fullName, user_profile(profileUrl) ) ),
      faculty:senderFacultyId ( users:userId ( fullName, user_profile(profileUrl) ) )
    `,
    )
    .eq("chatId", chatId)
    .single();

  if (error || !data) return null;
  return formatChatMessage(data);
}

function formatChatMessage(msg: any) {
  const isStudent = msg.senderRole === "STUDENT";
  const userObj = isStudent ? msg.students?.users : msg.faculty?.users;
  const profileObj = Array.isArray(userObj?.user_profile)
    ? userObj.user_profile[0]
    : userObj?.user_profile;

  return {
    chatId: msg.chatId,
    message: msg.message,
    mediaUrl: msg.mediaUrl,
    mediaType: msg.mediaType,
    senderRole: msg.senderRole,
    senderId: isStudent ? msg.senderStudentId : msg.senderFacultyId,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
    senderName: userObj?.fullName || (isStudent ? "Student" : "Faculty"),
    senderAvatar: profileObj?.profileUrl || null,
  };
}

export async function sendLeaveChatMessage(payload: {
  studentLeaveId: number;
  message?: string;
  fileUrl?: string;
  fileType?: string;
  senderId: number;
  senderRole: "STUDENT" | "FACULTY";
}) {
  if (!payload.senderId) throw new Error("Sender ID is missing");

  const now = new Date().toISOString();

  const insertData: any = {
    studentLeaveId: payload.studentLeaveId,
    message: payload.message?.trim() || null,
    mediaUrl: payload.fileUrl || null,
    mediaType: payload.fileType || null,
    senderRole: payload.senderRole,
    createdAt: now,
    updatedAt: now,
  };

  if (payload.senderRole === "STUDENT") {
    insertData.senderStudentId = payload.senderId;
  } else {
    insertData.senderFacultyId = payload.senderId;
  }

  const { data, error } = await supabase
    .from("leave_request_chats")
    .insert(insertData)
    .select("chatId")
    .single();

  if (error) throw new Error(error.message);

  return await fetchSingleChatMessage(data.chatId);
}

export async function markMessagesAsRead(
  studentLeaveId: number,
  receiverRole: "STUDENT" | "FACULTY",
) {
  const senderRoleToMark = receiverRole === "STUDENT" ? "FACULTY" : "STUDENT";
  await supabase
    .from("leave_request_chats")
    .update({ isRead: true })
    .eq("studentLeaveId", studentLeaveId)
    .eq("senderRole", senderRoleToMark)
    .eq("isRead", false);
}

export async function editLeaveChatMessage(chatId: number, message: string) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("leave_request_chats")
    .update({
      message: message.trim(),
      updatedAt: now,
    })
    .eq("chatId", chatId)
    .select()
    .single();

  if (error) throw error;
  return formatChatMessage(data);
}

export async function deleteLeaveChatMessage(chatId: number) {
  const { error } = await supabase
    .from("leave_request_chats")
    .delete()
    .eq("chatId", chatId);

  if (error) throw error;
}

export async function deleteLeaveChatMessages(chatIds: number[]) {
  const { error } = await supabase
    .from("leave_request_chats")
    .delete()
    .in("chatId", chatIds);

  if (error) throw error;
}

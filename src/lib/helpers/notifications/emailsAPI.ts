import { supabase } from "@/lib/supabaseClient";

export async function getUserEmails(userId: number, userEmail: string) {
  const { data, error } = await supabase
    .from("email_queue")
    .select("*")
    .or(`userId.eq.${userId},senderAddress.eq.${userEmail}`)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching emails:", error);
    return [];
  }
  return data || [];
}

export async function getUnreadEmailCount(userId: number, userEmail: string) {
  const { count, error } = await supabase
    .from("email_queue")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("isRead", false)
    .not("senderName", "is", null)
    .neq("senderAddress", userEmail);

  if (error) {
    console.error("getUnreadEmailCount error:", error);
    return 0;
  }
  return count ?? 0;
}

export async function markEmailRead(emailQueueId: number) {
  const { error } = await supabase
    .from("email_queue")
    .update({ isRead: true })
    .eq("emailQueueId", emailQueueId);
  return { success: !error };
}

export async function getGroupedUserEmails(userId: number, userEmail: string) {
  const { data, error } = await supabase
    .from("email_queue")
    .select("*")
    .or(`userId.eq.${userId},senderAddress.eq.${userEmail}`)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching emails:", error);
    return [];
  }

  const dbEmails = data || [];
  const filteredEmails = dbEmails.filter(
    (mail: any) => mail.senderName !== null,
  );

  const groupedEmails: any[] = [];
  const sentGroups = new Map();

  filteredEmails.forEach((mail: any) => {
    const isSentByMe = mail.senderAddress === userEmail;

    if (isSentByMe) {
      const timeKey = new Date(mail.createdAt).toISOString().substring(0, 16);
      const uniqueKey = `${mail.subject}-${timeKey}`;

      if (sentGroups.has(uniqueKey)) {
        sentGroups.get(uniqueKey).groupCount += 1;
      } else {
        const enrichedMail = { ...mail, groupCount: 1 };
        sentGroups.set(uniqueKey, enrichedMail);
        groupedEmails.push(enrichedMail);
      }
    } else {
      groupedEmails.push(mail);
    }
  });

  return groupedEmails.map((mail: any) => {
    const dateObj = new Date(mail.createdAt);
    const isSentByMe = mail.senderAddress === userEmail;

    const displaySenderName = isSentByMe ? "Me" : mail.senderName;
    const displayEmail = isSentByMe
      ? mail.groupCount > 1
        ? `To: Multiple Recipients (${mail.groupCount})`
        : `To: ${mail.email}`
      : mail.senderAddress;

    return {
      id: mail.emailQueueId,
      isRead: mail.isRead,
      initials: displaySenderName.substring(0, 2).toUpperCase(),
      color: isSentByMe ? "#E5E7EB" : "#DCE2FF",
      sender: displaySenderName,
      email: displayEmail,
      subject: mail.subject,
      Subject: mail.subject,
      desc: mail.body.replace(/<[^>]+>/g, "").substring(0, 50) + "...",
      time: dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      body: mail.body,
    };
  });
}

export async function fetchUserEmailsChunk(
  userId: number,
  userEmail: string,
  tab: "all" | "inbox" | "sent",
  page: number,
  limit: number = 12,
) {
  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("email_queue")
    .select("*")
    .order("createdAt", { ascending: false });

  if (tab === "inbox") {
    
    query = query
      .eq("userId", userId)
      .or(`senderAddress.neq.${userEmail},senderAddress.is.null`);
  } else if (tab === "sent") {
    query = query.eq("senderAddress", userEmail);
  } else {
    query = query.or(`userId.eq.${userId},senderAddress.eq.${userEmail}`);
  }

  const { data, error } = await query.range(from, to);

  if (error) {
    console.error("fetchUserEmailsChunk error:", error);
    return [];
  }
  return data || [];
}

export function groupAndFormatEmails(
  rawEmails: any[],
  currentUserEmail: string,
) {
  const filteredEmails = rawEmails.filter(
    (mail: any) => mail.senderName !== null,
  );

  const groupedEmails: any[] = [];
  const sentGroups = new Map();

  filteredEmails.forEach((mail: any) => {
    const isSentByMe = mail.senderAddress === currentUserEmail;

    if (isSentByMe) {
      const timeKey = new Date(mail.createdAt).toISOString().substring(0, 16);
      const uniqueKey = `${mail.subject}-${timeKey}`;

      if (sentGroups.has(uniqueKey)) {
        sentGroups.get(uniqueKey).groupCount += 1;
        sentGroups.get(uniqueKey).recipientList.push(mail.email);
      } else {
        const enrichedMail = {
          ...mail,
          groupCount: 1,
          recipientList: [mail.email],
        };
        sentGroups.set(uniqueKey, enrichedMail);
        groupedEmails.push(enrichedMail);
      }
    } else {
      groupedEmails.push(mail);
    }
  });

  return groupedEmails.map((mail: any) => {
    const dateObj = new Date(mail.createdAt);
    const isSentByMe = mail.senderAddress === currentUserEmail;

    const displaySenderName = isSentByMe ? "Me" : mail.senderName;
    const displayEmail = isSentByMe
      ? mail.groupCount > 1
        ? `To: Multiple Recipients (${mail.groupCount})`
        : `To: ${mail.email}`
      : mail.senderAddress;

    const initials = displaySenderName.substring(0, 2).toUpperCase();

    const displayDateStr = `${dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

    return {
      id: mail.emailQueueId,
      isRead: mail.isRead,
      initials: initials,
      color: isSentByMe ? "#E5E7EB" : "#DCE2FF",
      sender: displaySenderName,
      email: displayEmail,
      recipients: mail.recipientList || [mail.email],
      subject: mail.subject,
      Subject: mail.subject,
      desc: mail.body.replace(/<[^>]+>/g, "").substring(0, 50) + "...",
      time: dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: dateObj.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      displayDate: displayDateStr,
      body: mail.body,
    };
  });
}

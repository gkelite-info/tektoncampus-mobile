import { supabase } from "@/lib/supabaseClient";

const BUCKET = "college-drive";

export type DriveFileRow = {
  driveFileId: number;
  driveFolderId: number;
  collegeId: number;
  fileName: string;
  fileType: string;
  fileSize: number | null;
  fileUrl: string;
  uploadedBy: number;
  is_deleted: boolean | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export async function fetchDriveFilesByFolder(driveFolderId: number) {
  const { data, error } = await supabase
    .from("drive_files")
    .select(
      `
      driveFileId,
      driveFolderId,
      collegeId,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      uploadedBy,
      createdAt,
      updatedAt,
      deletedAt
    `,
    )
    .eq("driveFolderId", driveFolderId)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchDriveFilesByFolder error:", error);
    throw error;
  }

  return data ?? [];
}

// Returns file count and total size (raw bytes) grouped by folderId for a college
export async function fetchFolderStats(
  collegeId: number,
  userId?: number,
): Promise<Record<number, { totalFiles: number; totalSizeBytes: number }>> {
  const query = supabase
    .from("drive_files")
    .select("driveFolderId, fileSize")
    .eq("collegeId", collegeId)
    .is("deletedAt", null);

  const { data, error } = await (userId ? query.eq("uploadedBy", userId) : query);

  if (error) {
    console.error("fetchFolderStats error:", error);
    return {};
  }

  const stats: Record<number, { totalFiles: number; totalSizeBytes: number }> = {};
  for (const row of data ?? []) {
    const id = row.driveFolderId;
    if (!stats[id]) stats[id] = { totalFiles: 0, totalSizeBytes: 0 };
    stats[id].totalFiles += 1;
    stats[id].totalSizeBytes += row.fileSize ?? 0;
  }
  return stats;
}

export async function fetchRecentDriveFiles(
  collegeId: number,
  page: number = 1,
  limit: number = 10,
  userId?: number,
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const query = supabase
    .from("drive_files")
    .select(
      `
      driveFileId,
      driveFolderId,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      uploadedBy,
      createdAt
    `,
      { count: "exact" },
    )
    .eq("collegeId", collegeId)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false })
    .range(from, to);

  const { data, error, count } = await (userId
    ? query.eq("uploadedBy", userId)
    : query);

  if (error) {
    console.error("fetchRecentDriveFiles error:", error);
    throw error;
  }

  return { data: data ?? [], totalCount: count ?? 0 };
}

export async function fetchExistingDriveFile(
  driveFolderId: number,
  fileName: string,
) {
  const { data, error } = await supabase
    .from("drive_files")
    .select("driveFileId")
    .eq("driveFolderId", driveFolderId)
    .eq("fileName", fileName.trim())
    .is("deletedAt", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return { success: true, data: null };
    }
    throw error;
  }

  return { success: true, data };
}

export async function saveDriveFile(
  payload: {
    driveFileId?: number;
    driveFolderId: number;
    collegeId: number;
    fileName: string;
    fileType: string;
    fileSize?: number | null;
    fileUrl?: string;
    fileUri?: string; // RN specific
  },
  userId: number,
) {
  const now = new Date().toISOString();

  let fileUrl = payload.fileUrl ?? "";

  // Upload to bucket for new/replaced files using fileUri (for React Native)
  if (payload.fileUri) {
    const storagePath = `${payload.collegeId}/${payload.driveFolderId}/${payload.fileName.trim()}`;

    try {
      let arrayBuffer: ArrayBuffer;
      const { Platform } = require("react-native");

      if (Platform.OS === "web") {
        const response = await fetch(payload.fileUri);
        arrayBuffer = await response.arrayBuffer();
      } else {
        const { decode } = require("base64-arraybuffer");
        const FileSystem = require("expo-file-system/legacy");
        
        const base64 = await FileSystem.readAsStringAsync(payload.fileUri, {
          encoding: "base64",
        });
        arrayBuffer = decode(base64);
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, arrayBuffer, {
          upsert: true,
          contentType: payload.fileType,
        });

      if (uploadError) {
        console.error("saveDriveFile (storage upload) error:", uploadError);
        return { success: false, error: uploadError };
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

      fileUrl = urlData.publicUrl;
    } catch (e) {
       console.error("saveDriveFile (base64 conversion) error:", e);
       return { success: false, error: e };
    }
  }

  const upsertPayload: any = {
    driveFolderId: payload.driveFolderId,
    collegeId: payload.collegeId,
    fileName: payload.fileName.trim(),
    fileType: payload.fileType,
    fileSize: payload.fileSize ?? null,
    fileUrl,
    updatedAt: now,
  };

  if (!payload.driveFileId) {
    upsertPayload.uploadedBy = userId;
    upsertPayload.createdAt = now;

    // Check if a soft-deleted row exists for same folder + fileName
    const { data: deleted } = await supabase
      .from("drive_files")
      .select("driveFileId")
      .eq("driveFolderId", payload.driveFolderId)
      .eq("fileName", payload.fileName.trim())
      .eq("is_deleted", true)
      .maybeSingle();

    if (deleted?.driveFileId) {
      const { error } = await supabase
        .from("drive_files")
        .update({ ...upsertPayload, is_deleted: false, deletedAt: null })
        .eq("driveFileId", deleted.driveFileId);

      if (error) {
        console.error("saveDriveFile (restore) error:", error);
        return { success: false, error };
      }
      return { success: true, driveFileId: deleted.driveFileId };
    }

    const { data, error } = await supabase
      .from("drive_files")
      .insert([upsertPayload])
      .select("driveFileId")
      .single();

    if (error) {
      console.error("saveDriveFile (create) error:", error);
      return { success: false, error };
    }

    return { success: true, driveFileId: data.driveFileId };
  }

  const { error } = await supabase
    .from("drive_files")
    .update(upsertPayload)
    .eq("driveFileId", payload.driveFileId);

  if (error) {
    console.error("saveDriveFile (update) error:", error);
    return { success: false, error };
  }

  return {
    success: true,
    driveFileId: payload.driveFileId,
  };
}

export async function deleteDriveFile(
  driveFileId: number,
  collegeId: number,
  driveFolderId: number,
  fileName: string,
) {
  const { error } = await supabase
    .from("drive_files")
    .update({
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("driveFileId", driveFileId);

  if (error) {
    console.error("deleteDriveFile error:", error);
    return { success: false };
  }

  // Remove file from bucket
  const storagePath = `${collegeId}/${driveFolderId}/${fileName.trim()}`;
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (storageError) {
    console.error("deleteDriveFile (storage) error:", storageError);
  }

  return { success: true };
}

export async function fetchDriveFilesByUser(userId: number) {
  const { data, error } = await supabase
    .from("drive_files")
    .select(
      `
      driveFileId,
      driveFolderId,
      collegeId,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      createdAt
    `,
    )
    .eq("uploadedBy", userId)
    .is("deletedAt", null)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("fetchDriveFilesByUser error:", error);
    throw error;
  }

  return data ?? [];
}

import { supabase } from "@/lib/supabaseClient";

export interface EPaperRecord {
  ePaperId: number;
  name: string;
  publish_date: string;
  pdf_url: string;
  collegeId: number;
  createdBy: number;
  isActive: boolean;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export async function fetchEPapers(collegeId: number): Promise<EPaperRecord[]> {
  const { data, error } = await supabase
    .from("e_papers")
    .select("*")
    .eq("collegeId", collegeId)
    .eq("is_deleted", false)
    .eq("isActive", true)
    .order("publish_date", { ascending: false });

  if (error) {
    console.error("Fetch E-Papers Error:", error);
    throw new Error(error.message || "Failed to fetch E-Papers");
  }

  return data || [];
}

export async function uploadEPaper(
  name: string,
  date: string,
  file: { uri: string, name: string, type: string },
  collegeId: number,
  createdBy: number,
) {
  const fileExt = file.name.split(".").pop();
  const fileName = `epaper-${collegeId}-${Date.now()}.${fileExt}`;

  // In React Native with Supabase, we often upload using FormData
  const formData = new FormData();
  formData.append('files', {
    uri: file.uri,
    name: file.name,
    type: file.type || 'application/pdf',
  } as any);

  const { error: uploadError } = await supabase.storage
    .from("e-paper")
    .upload(fileName, formData, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage Upload Error:", uploadError);
    throw new Error("Failed to upload PDF to storage");
  }

  const { data: publicUrlData } = supabase.storage
    .from("e-paper")
    .getPublicUrl(fileName);

  const { data, error: dbError } = await supabase
    .from("e_papers")
    .insert([
      {
        name,
        publish_date: date,
        pdf_url: publicUrlData.publicUrl,
        collegeId,
        createdBy,
        isActive: true,
        is_deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (dbError) {
    console.error("DB Insert Error:", dbError);
    throw new Error(dbError.message || "Failed to save E-Paper record");
  }

  return data;
}

export async function deleteEPaper(ePaperId: number) {
  const { data, error } = await supabase
    .from("e_papers")
    .update({
      is_deleted: true,
      deletedAt: new Date().toISOString(),
    })
    .eq("ePaperId", ePaperId)
    .select()
    .single();

  if (error) {
    console.error("Soft Delete Error:", error);
    throw new Error(error.message || "Failed to delete E-Paper");
  }

  return data;
}

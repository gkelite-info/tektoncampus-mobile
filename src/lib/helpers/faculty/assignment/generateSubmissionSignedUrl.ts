import { supabase } from "@/lib/supabaseClient";

const BUCKET_NAME = "student_submissions";

export async function generateSubmissionSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600);

  if (error) throw error;

  return data?.signedUrl || null;
}

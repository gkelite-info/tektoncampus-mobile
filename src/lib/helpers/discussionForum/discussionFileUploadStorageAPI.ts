import { supabase } from "@/lib/supabaseClient";

export async function uploadDiscussionFiles(
  discussionId: number,
  files: File[],
): Promise<string[]> {
  const uploadedUrls: string[] = [];

  const allowedExtensions = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "png",
    "jpg",
    "jpeg",
  ];

  for (const file of files) {
    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error(
        `Invalid file format: ${file.name}. Only PDF, DOC, XLS, and Images are allowed.`,
      );
    }

    const fileName = `${discussionId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("discussion-files")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("uploadDiscussionFiles error:", error);
      throw new Error(`Failed to upload ${file.name}`);
    }

    const { data: publicUrl } = supabase.storage
      .from("discussion-files")
      .getPublicUrl(fileName);

    uploadedUrls.push(publicUrl.publicUrl);
  }

  return uploadedUrls;
}

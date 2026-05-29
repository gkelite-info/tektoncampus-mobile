import { supabase } from "@/lib/supabaseClient";

const now = () => new Date().toISOString();

export async function getUserProfilePhoto(userId: number) {
    const { data, error } = await supabase
        .from("user_profile")
        .select("userProfileId, profileUrl")
        .eq("userId", userId)
        .eq("is_deleted", false)
        .maybeSingle();

    if (error && error.code !== "PGRST116") throw error;
    return data;
}

async function deleteImageByUrl(url: string, userId: number) {
    if (!url) return;

    try {
        const bucketName = "user_profiles";
        const searchPath = `/public/${bucketName}/`;

        if (!url.includes(searchPath)) return;

        let extractedPath = url.split(searchPath)[1]?.split('?')[0];

        if (extractedPath) {
            const decodedPath = decodeURIComponent(extractedPath);
            if (!decodedPath.startsWith(`${userId}/`)) {
                console.error("Security Violation: Attempted to delete another user's file.");
                return;
            }

            const { error } = await supabase.storage.from(bucketName).remove([decodedPath]);

            if (error) {
                console.error("Failed to delete old image from Supabase:", error.message);
            }
        }
    } catch (e) {
        console.error("Cleanup function error:", e);
    }
}

async function uploadProfilePhoto(file: File, userId: number): Promise<string> {
    let fileExt = file.type.split('/')[1] || 'webp';
    if (fileExt === 'svg+xml') fileExt = 'svg';

    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    let attempt = 0;
    const maxAttempts = 2;
    let lastError: any = null;

    while (attempt < maxAttempts) {
        try {
            const { data, error: uploadError } = await supabase.storage
                .from("user_profiles")
                .upload(filePath, file, { contentType: file.type, upsert: false });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("user_profiles").getPublicUrl(filePath);
            return urlData.publicUrl;
        } catch (error) {
            lastError = error;
            attempt++;
            if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    throw new Error(`Storage Error: ${lastError?.message || "Unknown error"}`);
}

export async function upsertUserProfilePhoto(userId: number, file: File | string, oldProfileUrl: string | null) {
    let finalUrl = typeof file === 'string' ? file : '';

    try {
        if (file instanceof File) {
            finalUrl = await uploadProfilePhoto(file, userId);
        }

        const { data, error } = await supabase
            .from("user_profile")
            .upsert(
                { userId, profileUrl: finalUrl, updatedAt: now(), createdAt: now(), is_deleted: false },
                { onConflict: "userId" }
            )
            .select("userProfileId")
            .single();

        if (error) throw error;

        if (file instanceof File && oldProfileUrl && oldProfileUrl !== finalUrl) {
            await deleteImageByUrl(oldProfileUrl, userId);
        }

        return { data, publicUrl: finalUrl };

    } catch (error) {
        if (file instanceof File && finalUrl && finalUrl !== oldProfileUrl) {
            await deleteImageByUrl(finalUrl, userId);
        }
        throw error;
    }
}

export async function deleteUserProfilePhoto(userId: number, currentProfileUrl: string | null) {
    const { error } = await supabase
        .from("user_profile")
        .update({ is_deleted: true, deletedAt: now() })
        .eq("userId", userId)
        .eq("is_deleted", false);

    if (error) throw error;

    if (currentProfileUrl) {
        await deleteImageByUrl(currentProfileUrl, userId);
    }
}
import { supabase } from "@/lib/supabaseClient";

const BUCKET = "resume-certificates";

export interface CertificationPayload {
    studentId: number;
    certificationName: string;
    certificationCompletionId: string;
    certificateLink: string;
    uploadCertificate: string;
    startDate: string;       // ISO string e.g. "2026-04-06T00:00:00+00:00"
    endDate: string | null;  // optional
}

export async function uploadCertificateFile(
    studentId: number,
    file: File
): Promise<string> {
    const ext = file.name.split(".").pop();
    const filePath = `student_${studentId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { upsert: true });

    if (error) {
        console.error("uploadCertificateFile error:", error.message);
        throw error;
    }

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

    return data.publicUrl;
}

export async function getCertifications(studentId: number) {
    const { data, error } = await supabase
        .from("resume_certifications")
        .select("resumeCertificateId, certificationName, certificationCompletionId, certificateLink, uploadCertificate, startDate, endDate")
        .eq("studentId", studentId)
        .eq("is_deleted", false)
        .order("resumeCertificateId", { ascending: true });

    if (error) {
        console.error("getCertifications error:", error.message);
        throw error;
    }
    return data ?? [];
}

export async function insertCertification(
    payload: CertificationPayload
): Promise<{ resumeCertificateId: number }> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("resume_certifications")
        .insert({
            studentId: payload.studentId,
            certificationName: payload.certificationName,
            certificationCompletionId: payload.certificationCompletionId,
            certificateLink: payload.certificateLink,
            uploadCertificate: payload.uploadCertificate,
            startDate: payload.startDate,
            endDate: payload.endDate ?? null,
            is_deleted: false,
            createdAt: now,
            updatedAt: now,
        })
        .select("resumeCertificateId")
        .single();

    if (error) {
        console.error("insertCertification error:", error.message);
        throw error;
    }
    return data;
}

export async function updateCertification(
    resumeCertificateId: number,
    payload: Partial<CertificationPayload>
) {
    const { error } = await supabase
        .from("resume_certifications")
        .update({
            ...payload,
            updatedAt: new Date().toISOString(),
        })
        .eq("resumeCertificateId", resumeCertificateId)
        .eq("is_deleted", false);

    if (error) {
        console.error("updateCertification error:", error.message);
        throw error;
    }
}

export async function deleteCertification(resumeCertificateId: number) {
    const { error } = await supabase
        .from("resume_certifications")
        .update({
            is_deleted: true,
            deletedAt: new Date().toISOString(),
        })
        .eq("resumeCertificateId", resumeCertificateId);

    if (error) {
        console.error("deleteCertification error:", error.message);
        throw error;
    }
}
import { supabase } from "@/lib/supabaseClient";
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

export type SaveTopicResourceParams = {
    fileUri?: string;
    pdfBuffer?: ArrayBuffer;
    topicTitle: string;
    collegeSubjectUnitTopicId: number;
    collegeId: number;
    createdBy: number;
    isAdmin: number;
    contentType?: string;
    originalFileName?: string;
};

export type SavedResource = {
    collegeSubjectUnitTopicResourceId: number;
    resourceUrl: string;
    resourceName: string;
};

export type TopicResourceRow = {
    collegeSubjectUnitTopicResourceId: number;
    resourceType: string | null;
    resourceName: string;
    resourceUrl: string;
    collegeSubjectUnitTopicId: number;
    collegeId: number;
    createdBy: number | null;
    isAdmin: number | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
};

export type TopicResourcePreview = {
    collegeSubjectUnitTopicResourceId: number;
    resourceName: string;
    resourceUrl: string;
    createdAt: string;
};



export async function saveTopicResource(
    params: SaveTopicResourceParams
): Promise<SavedResource> {
    const {
        fileUri,
        pdfBuffer,
        topicTitle,
        collegeSubjectUnitTopicId,
        collegeId,
        createdBy,
        isAdmin,
        contentType,
        originalFileName,
    } = params;

    let fileBuffer: Buffer;
    let ext = 'pdf';
    const mime = contentType || "application/pdf";

    if (pdfBuffer) {
        fileBuffer = Buffer.from(pdfBuffer);
        ext = originalFileName ? (originalFileName.split('.').pop() || 'pdf') : 'pdf';
    } else if (fileUri) {
        // Read the file as base64 and convert it to a Buffer
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64',
        });
        fileBuffer = Buffer.from(base64, 'base64');
        ext = originalFileName ? (originalFileName.split('.').pop() || 'pdf') : 'pdf';
    } else {
        throw new Error("Either fileUri or pdfBuffer must be provided");
    }

    const slug = topicTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const timestamp = Date.now();
    const fileName = `${slug}-${timestamp}.${ext}`;
    const storagePath = `college-${collegeId}/topic-${collegeSubjectUnitTopicId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from("topic-resources")
        .upload(storagePath, fileBuffer, {
            contentType: mime,
            upsert: false,
        });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
        .from("topic-resources")
        .getPublicUrl(storagePath);

    const resourceUrl = urlData.publicUrl;
    const now = new Date().toISOString();
    const resourceType = ext.toLowerCase() === 'pdf' ? 'PDF' : 'VIDEO';

    const { data, error: dbError } = await supabase
        .from("college_subject_unit_topic_resources")
        .insert({
            resourceType,
            resourceName: originalFileName || `${topicTitle}.pdf`,
            resourceUrl,
            collegeSubjectUnitTopicId,
            collegeId,
            createdBy,
            isAdmin,
            isActive: true,
            createdAt: now,
            updatedAt: now,
        })
        .select("collegeSubjectUnitTopicResourceId, resourceUrl, resourceName")
        .single();

    if (dbError) throw new Error(`DB insert failed: ${dbError.message}`);

    return data as SavedResource;
}


export async function fetchTopicResources(
    collegeSubjectUnitTopicId: number
): Promise<TopicResourceRow[]> {
    const { data, error } = await supabase
        .from("college_subject_unit_topic_resources")
        .select(`
      collegeSubjectUnitTopicResourceId,
      resourceType,
      resourceName,
      resourceUrl,
      collegeSubjectUnitTopicId,
      collegeId,
      createdBy,
      isAdmin,
      isActive,
      createdAt,
      updatedAt
    `)
        .eq("collegeSubjectUnitTopicId", collegeSubjectUnitTopicId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchTopicResources error:", error);
        throw error;
    }

    return data ?? [];
}


export async function fetchTopicResourcesByFaculty(
    facultyId: number,
    collegeSubjectUnitTopicId: number
): Promise<TopicResourcePreview[]> {
    const { data, error } = await supabase
        .from("college_subject_unit_topic_resources")
        .select(`
      collegeSubjectUnitTopicResourceId,
      resourceName,
      resourceUrl,
      createdAt
    `)
        .eq("createdBy", facultyId)
        .eq("collegeSubjectUnitTopicId", collegeSubjectUnitTopicId)
        .eq("isActive", true)
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("fetchTopicResourcesByFaculty error:", error);
        throw error;
    }

    return data ?? [];
}


export async function deactivateTopicResource(
    resourceId: number
) {
    const { error } = await supabase
        .from("college_subject_unit_topic_resources")
        .update({
            isActive: false,
            updatedAt: new Date().toISOString(),
        })
        .eq("collegeSubjectUnitTopicResourceId", resourceId);

    if (error) {
        console.error("deactivateTopicResource error:", error);
        return { success: false };
    }

    return { success: true };
}
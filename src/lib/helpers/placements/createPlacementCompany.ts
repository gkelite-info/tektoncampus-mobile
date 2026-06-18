import { supabase } from "@/lib/supabaseClient";

type CreatePlacementCompanyPayload = {
    companyName: string;
    companyEmail: string;
    companyPhone: string;
    companyJobDescription: string;
    companyWebsite: string;
    jobRoleOffered: string;
    requiredSkills: string[];
    jobType: string;
    workMode: string;
    location: string;
    annualPackage: number;
    driveType: string;
    companyLogo: File;
    companyCertificates: File[];
    startDate: string;
    endDate: string;
    eligibilityCriteria: string;
    collegeId: number;
    collegeBranchId: number;
    collegeAcademicYearId: number;
    createdBy: number;
};

type UpdatePlacementCompanyPayload = Omit<
    CreatePlacementCompanyPayload,
    "companyLogo" | "companyCertificates" | "createdBy"
> & {
    placementCompanyIds: number[];
    updatedBy: number;
    companyLogo?: File | null;
    companyCertificates?: File[];
};

// ── Upload helper ─────────────────────────────────────────────────────────────
const JOB_TYPE_VALUES: Record<string, string> = {
    fulltime: "fulltime",
    "Full Time": "fulltime",
    "Full-Time": "fulltime",
    internship: "internship",
    Internship: "internship",
    contract: "contract",
    Contract: "contract",
};

const WORK_MODE_VALUES: Record<string, string> = {
    onsite: "onsite",
    Onsite: "onsite",
    hybrid: "hybrid",
    Hybrid: "hybrid",
    remote: "remote",
    Remote: "remote",
};

const DRIVE_TYPE_VALUES: Record<string, string> = {
    virtual: "virtual",
    Virtual: "virtual",
    "Virtual Drive": "virtual",
    inperson: "inperson",
    "In Person": "inperson",
    "In Person(Office)": "inperson",
    "In-Person": "inperson",
};

function normalizeEnumValue(
    fieldName: string,
    value: string,
    allowedValues: Record<string, string>,
    expectedValues: string
) {
    const normalized = allowedValues[value];

    if (!normalized) {
        throw new Error(
            `Invalid ${fieldName} "${value}". Expected one of: ${expectedValues}`
        );
    }

    return normalized;
}

const normalizeJobType = (value: string) =>
    normalizeEnumValue("job type", value, JOB_TYPE_VALUES, "fulltime, internship, contract");

const normalizeWorkMode = (value: string) =>
    normalizeEnumValue("work mode", value, WORK_MODE_VALUES, "onsite, hybrid, remote");

const normalizeDriveType = (value: string) =>
    normalizeEnumValue("drive type", value, DRIVE_TYPE_VALUES, "virtual, inperson");

async function uploadFile(
    bucket: "placement-logos" | "placement-certificates",
    file: File,
    collegeId: number,
    placementOfficerId: number
): Promise<string> {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `placement-companies/${collegeId}/${placementOfficerId}/${fileName}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: false });

    if (error) throw new Error(`Upload failed (${bucket}): ${error.message}`);

    return filePath;
}

// ── Main insert ───────────────────────────────────────────────────────────────
export async function createPlacementCompany(payload: CreatePlacementCompanyPayload) {
    // 1. Upload logo and all certificates in parallel
    const [companyLogoUrl, companyCertificateUrls] = await Promise.all([
        uploadFile(
            "placement-logos",
            payload.companyLogo,
            payload.collegeId,
            payload.createdBy
        ),
        Promise.all(
            payload.companyCertificates.map((certificate) =>
                uploadFile(
                    "placement-certificates",
                    certificate,
                    payload.collegeId,
                    payload.createdBy
                )
            )
        ),
    ]);
    const now = new Date().toISOString();

    // 2. Build insert payload
    const baseInsertPayload = {
        companyName: payload.companyName,
        companyEmail: payload.companyEmail,
        companyPhone: payload.companyPhone,
        companyJobDescription: payload.companyJobDescription,
        companyWebsite: payload.companyWebsite,
        jobRoleOffered: payload.jobRoleOffered,
        requiredSkills: payload.requiredSkills,
        jobType: normalizeJobType(payload.jobType),
        workMode: normalizeWorkMode(payload.workMode),
        location: payload.location,
        annualPackage: payload.annualPackage,
        driveType: normalizeDriveType(payload.driveType),
        companyLogo: companyLogoUrl,
        startDate: payload.startDate,
        endDate: payload.endDate,
        eligibilityCriteria: payload.eligibilityCriteria,
        collegeId: payload.collegeId,
        collegeBranchId: payload.collegeBranchId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        createdBy: payload.createdBy,
        createdAt: now,
        updatedAt: now,
    };

    const insertPayload = companyCertificateUrls.map((certificateUrl) => ({
        ...baseInsertPayload,
        companyCertificate: certificateUrl,
    }));

    const { data, error } = await supabase
        .from("placement_companies")
        .insert(insertPayload)
        .select("placementCompanyId");

    if (error) {
        console.error("🗄️ Supabase insert error:", error);
        console.error("🗄️ Supabase error code:", error.code);
        console.error("🗄️ Supabase error message:", error.message);
        console.error("🗄️ Supabase error details:", error.details);
        console.error("🗄️ Supabase error hint:", error.hint);
        throw error;
    }

    return data;
}

export async function updatePlacementCompany(payload: UpdatePlacementCompanyPayload) {
    const now = new Date().toISOString();
    const placementCompanyIds = payload.placementCompanyIds.filter(Boolean);

    if (placementCompanyIds.length === 0) {
        throw new Error("No placement company row selected for update");
    }

    const [companyLogoUrl, companyCertificateUrls] = await Promise.all([
        payload.companyLogo
            ? uploadFile(
                "placement-logos",
                payload.companyLogo,
                payload.collegeId,
                payload.updatedBy
            )
            : Promise.resolve<string | null>(null),
        payload.companyCertificates?.length
            ? Promise.all(
                payload.companyCertificates.map((certificate) =>
                    uploadFile(
                        "placement-certificates",
                        certificate,
                        payload.collegeId,
                        payload.updatedBy
                    )
                )
            )
            : Promise.resolve<string[]>([]),
    ]);

    const updatePayload = {
        companyName: payload.companyName,
        companyEmail: payload.companyEmail,
        companyPhone: payload.companyPhone,
        companyJobDescription: payload.companyJobDescription,
        companyWebsite: payload.companyWebsite,
        jobRoleOffered: payload.jobRoleOffered,
        requiredSkills: payload.requiredSkills,
        jobType: normalizeJobType(payload.jobType),
        workMode: normalizeWorkMode(payload.workMode),
        location: payload.location,
        annualPackage: payload.annualPackage,
        driveType: normalizeDriveType(payload.driveType),
        ...(companyLogoUrl ? { companyLogo: companyLogoUrl } : {}),
        startDate: payload.startDate,
        endDate: payload.endDate,
        eligibilityCriteria: payload.eligibilityCriteria,
        collegeId: payload.collegeId,
        collegeBranchId: payload.collegeBranchId,
        collegeAcademicYearId: payload.collegeAcademicYearId,
        updatedAt: now,
    };

    const { error } = await supabase
        .from("placement_companies")
        .update(updatePayload)
        .in("placementCompanyId", placementCompanyIds);

    if (error) {
        console.error("🗄️ Supabase update error:", error);
        throw error;
    }

    if (companyCertificateUrls.length > 0) {
        const certificateUpdates = companyCertificateUrls
            .slice(0, placementCompanyIds.length)
            .map((certificateUrl, index) =>
                supabase
                    .from("placement_companies")
                    .update({
                        companyCertificate: certificateUrl,
                        updatedAt: now,
                    })
                    .eq("placementCompanyId", placementCompanyIds[index])
            );

        const certificateResults = await Promise.all(certificateUpdates);
        const certificateError = certificateResults.find((result) => result.error)?.error;

        if (certificateError) {
            console.error("🗄️ Supabase certificate update error:", certificateError);
            throw certificateError;
        }
    }

    return { placementCompanyIds };
}

export async function deletePlacementCompany(placementCompanyIds: number[]) {
    const now = new Date().toISOString();
    const idsToDelete = placementCompanyIds.filter(Boolean);

    if (idsToDelete.length === 0) {
        throw new Error("No placement company row selected for delete");
    }

    const { error } = await supabase
        .from("placement_companies")
        .update({
            is_deleted: true,
            deletedAt: now,
            updatedAt: now,
        })
        .in("placementCompanyId", idsToDelete);

    if (error) {
        console.error("Placement company soft delete error:", error);
        throw error;
    }

    return { placementCompanyIds: idsToDelete };
}

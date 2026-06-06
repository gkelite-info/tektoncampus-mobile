import { supabase } from "@/lib/supabaseClient";

const now = () => new Date().toISOString();
async function fetchEducation(table: string, userId: number) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("userId", userId)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    console.error(`[fetchEducation] table=${table}`, error.message);
    return { success: false, data: null };
  }

  return { success: true, data };
}


const WRITABLE_COLUMNS: Record<string, string[]> = {
  primary_education: [
    "userId", "collegeId", "schoolName", "board",
    "mediumOfStudy", "yearOfPassing", "location",
    "is_deleted", "createdAt", "updatedAt", "deletedAt",
  ],
  secondary_education: [
    "userId", "collegeId", "institutionName", "board",
    "mediumOfStudy", "yearOfPassing", "percentage", "location",
    "is_deleted", "createdAt", "updatedAt", "deletedAt",
  ],
  undergraduate_education: [
    "userId", "collegeId", "courseName", "specialization",
    "collegeName", "CGPA", "startYear", "endYear", "courseType",
    "is_deleted", "createdAt", "updatedAt", "deletedAt",
  ],
  phd_education: [
    "userId", "collegeId", "universityName", "researchArea",
    "supervisorName", "startYear", "endYear",
    "is_deleted", "createdAt", "updatedAt", "deletedAt",
  ],
};

const PK_FIELD: Record<string, string> = {
  primary_education:        "primaryEducationId",
  secondary_education:      "secondaryEducationId",
  undergraduate_education:  "undergraduateEducationId",
  phd_education:            "phdeducationId",
};

function pickWritable(table: string, payload: Record<string, any>): Record<string, any> {
  const allowed = WRITABLE_COLUMNS[table];
  if (!allowed) return payload;
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowed.includes(key))
  );
}

async function saveEducation({
  table,
  idField,
  payload,
}: {
  table: string;
  idField: string;
  payload: Record<string, any>;
}) {
  const timestamp = now();
  const idValue   = payload[idField];

  if (idValue != null) {
    const writePayload = pickWritable(table, { ...payload, updatedAt: timestamp });

    const { error } = await supabase
      .from(table)
      .update(writePayload)
      .eq(idField, idValue)
      .eq("userId", payload.userId);

    if (error) {
      console.error(`[saveEducation/update] table=${table}`, error.message);
      return { success: false };
    }
    return { success: true, id: idValue };
  }

  const upsertPayload = pickWritable(table, {
    ...payload,
    is_deleted: false,
    deletedAt:  null, 
    updatedAt:  timestamp,
    createdAt:  timestamp,
  });

  const { data, error } = await supabase
    .from(table)
    .upsert(upsertPayload, {
      onConflict: "userId",
      ignoreDuplicates: false,
    })
    .select(idField)
    .maybeSingle();

  if (error) {
    console.error(`[saveEducation/upsert] table=${table}`, error.message);
    return { success: false };
  }

  return { success: true, id: (data as Record<string, any>)?.[idField] };
}


async function deleteEducation(
  table: string,
  idField: string,
  id: number,
  userId: number
) {
  const { error } = await supabase
    .from(table)
    .update({ is_deleted: true, deletedAt: now(), updatedAt: now() })
    .eq(idField, id)
    .eq("userId", userId);

  if (error) {
    console.error(`[deleteEducation] table=${table}`, error.message);
    return { success: false };
  }
  return { success: true };
}


export const primaryEducationAPI = {
  fetch:  (userId: number) => fetchEducation("primary_education", userId),
  save:   (payload: any)   => saveEducation({ table: "primary_education", idField: "primaryEducationId", payload }),
  delete: (id: number, userId: number) => deleteEducation("primary_education", "primaryEducationId", id, userId),
};

export const secondaryEducationAPI = {
  fetch:  (userId: number) => fetchEducation("secondary_education", userId),
  save:   (payload: any)   => saveEducation({ table: "secondary_education", idField: "secondaryEducationId", payload }),
  delete: (id: number, userId: number) => deleteEducation("secondary_education", "secondaryEducationId", id, userId),
};

export const undergraduateEducationAPI = {
  fetch:  (userId: number) => fetchEducation("undergraduate_education", userId),
  save:   (payload: any)   => saveEducation({ table: "undergraduate_education", idField: "undergraduateEducationId", payload }),
  delete: (id: number, userId: number) => deleteEducation("undergraduate_education", "undergraduateEducationId", id, userId),
};

export const phdEducationAPI = {
  fetch:  (userId: number) => fetchEducation("phd_education", userId),
  save:   (payload: any)   => saveEducation({ table: "phd_education", idField: "phdeducationId", payload }),
  delete: (id: number, userId: number) => deleteEducation("phd_education", "phdeducationId", id, userId),
};

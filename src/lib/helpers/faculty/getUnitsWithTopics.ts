import { supabase } from "@/lib/supabaseClient";

export type DbUnit = {
  collegeSubjectUnitId: number;
  unitNumber: number;
  unitTitle: string;
  startDate: string | null;
  endDate: string | null;
  completionPercentage: number | null;
  collegeSubjectId: number;
  collegeId: number;
};

export type DbTopic = {
  collegeSubjectUnitTopicId: number;
  topicTitle: string;
  isCompleted: boolean | null;
  displayOrder: number;
  collegeSubjectUnitId: number;
};

export type UnitColor = "purple" | "orange" | "blue";

export type UiTopic = {
  id: number;
  title: string;
  isCompleted: boolean;
};

export type UiUnit = {
  id: number;
  unitLabel: string;
  title: string;
  color: UnitColor;
  dateRange: string;
  percentage: number;
  topics: UiTopic[];
};

const formatDate = (d: string | null) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
};

const buildDateRange = (startDate: string | null, endDate: string | null) => {
  const s = formatDate(startDate);
  const e = formatDate(endDate);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  if (e) return e;
  return "";
};

const colorByUnitNumber = (n: number): UnitColor => {
  const mod = n % 3;
  if (mod === 1) return "purple";
  if (mod === 2) return "orange";
  return "blue";
};

export async function getUnitsWithTopics(params: {
  collegeId: number;
  collegeSubjectId: number;
}) {
  const { collegeId, collegeSubjectId } = params;

  const { data: units, error: unitsErr } = await supabase
    .from("college_subject_units")
    .select(
      `
      collegeSubjectUnitId,
      unitNumber,
      unitTitle,
      startDate,
      endDate,
      completionPercentage,
      collegeSubjectId,
      collegeId
    `
    )
    .eq("collegeId", collegeId)
    .eq("collegeSubjectId", collegeSubjectId)
    .eq("isActive", true)
    .order("unitNumber", { ascending: true });

  if (unitsErr) throw new Error(unitsErr.message);

  const unitIds = (units ?? []).map((u) => u.collegeSubjectUnitId);

  let topics: DbTopic[] = [];
  if (unitIds.length > 0) {
    const { data: t, error: topicsErr } = await supabase
      .from("college_subject_unit_topics")
      .select(
        `
        collegeSubjectUnitTopicId,
        topicTitle,
        isCompleted,
        displayOrder,
        collegeSubjectUnitId
      `
      )
      .eq("collegeId", collegeId)
      .eq("collegeSubjectId", collegeSubjectId)
      .eq("isActive", true)
      .in("collegeSubjectUnitId", unitIds)
      .order("displayOrder", { ascending: true });

    if (topicsErr) throw new Error(topicsErr.message);
    topics = t ?? [];
  }

  const topicsByUnitId = new Map<number, DbTopic[]>();
  for (const tp of topics) {
    const arr = topicsByUnitId.get(tp.collegeSubjectUnitId) ?? [];
    arr.push(tp);
    topicsByUnitId.set(tp.collegeSubjectUnitId, arr);
  }

  const uiUnits: UiUnit[] = (units ?? []).map((u: DbUnit) => {
    const unitTopics = topicsByUnitId.get(u.collegeSubjectUnitId) ?? [];
    return {
      id: u.collegeSubjectUnitId,
      unitLabel: `Unit - ${u.unitNumber}`,
      title: u.unitTitle,
      color: colorByUnitNumber(u.unitNumber),
      dateRange: buildDateRange(u.startDate, u.endDate),
      percentage: u.completionPercentage ?? 0,
      topics: unitTopics.map((x) => ({
        id: x.collegeSubjectUnitTopicId,
        title: x.topicTitle,
        isCompleted: x.isCompleted ?? false,
      })),
    };
  });

  return uiUnits;
}

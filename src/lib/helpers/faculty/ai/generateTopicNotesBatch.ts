

import {
  createFallbackTopicNotes,
  generateTopicNotes,
  type TopicNotes,
} from "./Generatetopicnotes";

type TopicInput = {
  collegeSubjectUnitTopicId: number;
  topicTitle: string;
};

type BatchParams = {
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
  topics: TopicInput[];
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>;
    const message = errorRecord.message ?? errorRecord.error;
    const status = errorRecord.status ?? errorRecord.statusCode;
    const code = errorRecord.code;

    if (typeof message === "string" && message.trim()) {
      return [status ? `status ${status}` : null, code ? `code ${code}` : null, message]
        .filter(Boolean)
        .join(" - ");
    }

    try {
      const serialized = JSON.stringify(errorRecord);
      if (serialized && serialized !== "{}") {
        return serialized;
      }
    } catch {
      
    }
  }

  return "Failed to generate topic notes";
}

export type GeneratedTopicNotesResult =
  | {
    success: true;
    collegeSubjectUnitTopicId: number;
    topicTitle: string;
    notes: TopicNotes;
  }
  | {
    success: false;
    collegeSubjectUnitTopicId: number;
    topicTitle: string;
    error: string;
  };

export async function generateTopicNotesBatchAction(
  params: BatchParams,
): Promise<GeneratedTopicNotesResult[]> {
  const results: GeneratedTopicNotesResult[] = [];

  for (const topic of params.topics) {
    try {

      const notes = await generateTopicNotes({
        topicTitle: topic.topicTitle,
        subjectName: params.subjectName,
        unitName: params.unitName,
        branch: params.branch,
        educationType: params.educationType,
      });

      results.push({
        success: true,
        collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
        topicTitle: topic.topicTitle,
        notes,
      });
    } catch (error: unknown) {
      console.error("[generateTopicNotesBatchAction] Failed", {
        topicId: topic.collegeSubjectUnitTopicId,
        topicTitle: topic.topicTitle,
        error: getErrorMessage(error),
      });

      try {
        const fallbackNotes = createFallbackTopicNotes({
          topicTitle: topic.topicTitle,
          subjectName: params.subjectName,
          unitName: params.unitName,
          branch: params.branch,
          educationType: params.educationType,
        });

        console.warn("[generateTopicNotesBatchAction] Using fallback notes", {
          topicId: topic.collegeSubjectUnitTopicId,
          topicTitle: topic.topicTitle,
          originalError: getErrorMessage(error),
        });

        results.push({
          success: true,
          collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
          topicTitle: topic.topicTitle,
          notes: fallbackNotes,
        });
      } catch (fallbackError: unknown) {
        results.push({
          success: false,
          collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
          topicTitle: topic.topicTitle,
          error: `${getErrorMessage(error)}; fallback failed: ${getErrorMessage(fallbackError)}`,
        });
      }
    }
  }

  return results;
}

export async function generateFastTopicNotesBatchAction(
  params: BatchParams,
): Promise<GeneratedTopicNotesResult[]> {
  return Promise.all(
    params.topics.map(async (topic) => {
      try {
        const notes = await generateTopicNotes({
          topicTitle: topic.topicTitle,
          subjectName: params.subjectName,
          unitName: params.unitName,
          branch: params.branch,
          educationType: params.educationType,
        });

        return {
          success: true,
          collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
          topicTitle: topic.topicTitle,
          notes,
        };
      } catch (error: unknown) {
        try {
          const fallbackNotes = createFallbackTopicNotes({
            topicTitle: topic.topicTitle,
            subjectName: params.subjectName,
            unitName: params.unitName,
            branch: params.branch,
            educationType: params.educationType,
          });

          return {
            success: true,
            collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
            topicTitle: topic.topicTitle,
            notes: fallbackNotes,
          };
        } catch (fallbackError: unknown) {
          return {
            success: false,
            collegeSubjectUnitTopicId: topic.collegeSubjectUnitTopicId,
            topicTitle: topic.topicTitle,
            error: `${getErrorMessage(error)}; fallback failed: ${getErrorMessage(fallbackError)}`,
          };
        }
      }
    }),
  );
}

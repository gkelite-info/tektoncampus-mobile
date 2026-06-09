import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { buildTopicHtml } from "./Generatetopichtml";
import { generateTopicNotesBatchAction } from "./generateTopicNotesBatch";
import { saveTopicResource } from "../Savetopicresource";

export type GeneratePdfsForTopicsParams = {
  topics: {
    collegeSubjectUnitTopicId: number;
    topicTitle: string;
  }[];
  subjectName: string;
  unitName: string;
  branch: string;
  educationType: string;
  collegeId: number;
  createdBy: number;
  isAdmin: number;
};

export type TopicPdfResult = {
  collegeSubjectUnitTopicId: number;
  topicTitle: string;
  status: "success" | "failed";
  resourceUrl?: string;
  error?: string;
};

export async function generatePdfsForTopics(
  params: GeneratePdfsForTopicsParams
): Promise<TopicPdfResult[]> {
  const {
    topics,
    subjectName,
    unitName,
    branch,
    educationType,
    collegeId,
    createdBy,
    isAdmin,
  } = params;

  const results: TopicPdfResult[] = [];

  // Generate all notes via Groq
  const notesResults = await generateTopicNotesBatchAction({
    subjectName,
    unitName,
    branch,
    educationType,
    topics,
  });

  for (const result of notesResults) {
    if (!result.success) {
      results.push({
        collegeSubjectUnitTopicId: result.collegeSubjectUnitTopicId,
        topicTitle: result.topicTitle,
        status: "failed",
        error: result.error,
      });
      continue;
    }

    try {
      // Build HTML
      const html = buildTopicHtml(result.notes!);

      // Print to local PDF
      const { uri } = await Print.printToFileAsync({
        html,
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        base64: false,
      });

      // Read as base64 and decode to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      const arrayBuffer = decode(base64);

      // Clean up local temp file
      await FileSystem.deleteAsync(uri, { idempotent: true });

      // Save to Supabase
      const saved = await saveTopicResource({
        pdfBuffer: arrayBuffer as any,
        topicTitle: result.topicTitle,
        collegeSubjectUnitTopicId: result.collegeSubjectUnitTopicId,
        collegeId,
        createdBy,
        isAdmin,
      });

      results.push({
        collegeSubjectUnitTopicId: result.collegeSubjectUnitTopicId,
        topicTitle: result.topicTitle,
        status: "success",
        resourceUrl: saved.resourceUrl,
      });
    } catch (err: any) {
      results.push({
        collegeSubjectUnitTopicId: result.collegeSubjectUnitTopicId,
        topicTitle: result.topicTitle,
        status: "failed",
        error: err?.message ?? "Unknown error",
      });
    }
  }

  return results;
}

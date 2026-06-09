

import { generateWithGroqFallback } from "./groqClient";

const INVALID_UNIT_MESSAGE =
  "The unit name does not match the selected subject.";

export async function suggestTopicsAction(
  subject: string,
  unitName: string,
  educationType?: string,
  branch?: string
): Promise<string[]> {

  if (!subject || !unitName) {
    console.warn("🔴 [suggestTopicsAction] Missing subject or unitName");
    return [];
  }

  const prompt = `
You are given academic context from an Indian college syllabus.

Education Type: ${educationType || "B.Tech"}
Branch: ${branch || "CSE"}
Subject: ${subject}
Unit Name: ${unitName}

TASK:
1. First determine whether the Unit Name is academically relevant to the Subject.
2. If the Unit Name does NOT match the Subject, return ONLY this exact JSON array:
["${INVALID_UNIT_MESSAGE}"]

3. If the Unit Name matches the Subject, return ONLY a JSON array of exactly 8 topic strings.

STRICT RULES:
- Output must be valid raw JSON only
- No markdown
- No explanation
- No extra text
- No headings
- No backticks
- Topics must be directly relevant to BOTH Subject and Unit Name
- Topics must be 6–10 words each
- Use precise academic terminology
`;

  try {
    const rawText = await generateWithGroqFallback(prompt);
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [];
    }

    if (
      parsed.length === 1 &&
      typeof parsed[0] === "string" &&
      parsed[0].trim() === INVALID_UNIT_MESSAGE
    ) {
      return [INVALID_UNIT_MESSAGE];
    }

    const filtered = parsed.filter(
      (t: unknown) =>
        typeof t === "string" &&
        t.trim().length > 5 &&
        t.trim() !== INVALID_UNIT_MESSAGE
    );

    return filtered.slice(0, 8);
  } catch (err) {
    console.error("[suggestTopicsAction] Failed:", err);
    throw new Error("AI topic generation failed. Please try again.");
  }
}
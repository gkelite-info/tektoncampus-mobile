const INVALID_UNIT_MESSAGE = "The unit name does not match the selected subject.";

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

type RawGroqParams = {
  prompt: string;
  systemPrompt: string;
  maxTokens?: number;
  temperature?: number;
};

export async function generateRawWithGroqFallback({
  prompt,
  systemPrompt,
  maxTokens = 600,
  temperature = 0,
}: RawGroqParams): Promise<string> {
  let lastError: any = null;

  for (const model of GROQ_MODELS) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const raw = data.choices?.[0]?.message?.content?.trim();

      if (!raw) {
        console.warn(`[groqClient] Empty response from ${model}, trying next`);
        continue;
      }

      return raw;
    } catch (error: any) {
      lastError = error;
      console.warn(`[groqClient] Error on ${model}:`, error.message);
      continue;
    }
  }

  console.error("[groqClient] All models exhausted");
  throw lastError ?? new Error("All Groq models exhausted");
}

export async function generateWithGroqFallback(prompt: string): Promise<string> {
  const systemPrompt = `You are a university syllabus topic generator for Indian engineering colleges.

YOUR JOB:
Given Education Type, Branch, Subject Name, and Unit Name:

1. Check whether the Unit Name is academically relevant to the Subject Name.
2. If the Unit Name does NOT match the Subject, return ONLY this exact JSON array:
["${INVALID_UNIT_MESSAGE}"]

3. If the Unit Name matches the Subject, return ONLY a raw JSON array of exactly 8 topic strings.

STRICT OUTPUT RULES:
- Return ONLY valid raw JSON
- No markdown
- No backticks
- No explanation
- No notes
- No headings
- No extra text

TOPIC RULES:
- Exactly 8 topics
- Each topic must be 6-10 words
- Precise academic terminology
- Strongly relevant to BOTH subject and unit
- No vague labels like "Introduction" or "Overview"

EXAMPLE VALID OUTPUT:
["Asymptotic analysis of recursive algorithms", "Recurrence relations in divide and conquer", "Best case and worst case complexity bounds", "Amortized analysis for dynamic data structures", "Complexity classes for sorting algorithms", "Time space tradeoffs in algorithm design", "Mathematical proofs for asymptotic notation", "Growth rate comparison of common functions"]

EXAMPLE INVALID OUTPUT:
["${INVALID_UNIT_MESSAGE}"]`;

  let lastError: any = null;

  for (const model of GROQ_MODELS) {
    try {
      const raw = await generateRawWithGroqFallback({
        prompt,
        systemPrompt,
        maxTokens: 600,
        temperature: 0,
      });

      const cleaned = raw.replace(/```json|```/gi, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        console.warn(`[groqClient] Not an array from ${model}, trying next`);
        continue;
      }

      if (
        parsed.length === 1 &&
        typeof parsed[0] === "string" &&
        parsed[0].trim() === INVALID_UNIT_MESSAGE
      ) {
        return JSON.stringify([INVALID_UNIT_MESSAGE]);
      }

      const valid = parsed.filter(
        (topic: unknown) =>
          typeof topic === "string" &&
          topic.trim().length > 5 &&
          topic.trim() !== INVALID_UNIT_MESSAGE,
      );

      if (valid.length === 0) {
        console.warn(`[groqClient] No valid topics from ${model}, trying next`);
        continue;
      }

      return JSON.stringify(valid.slice(0, 8));
    } catch (error: any) {
      lastError = error;

      if (error instanceof SyntaxError) {
        console.warn(`[groqClient] JSON parse failed for ${model}:`, error);
        continue;
      }
    }
  }

  console.error("[groqClient] All models exhausted");
  throw lastError ?? new Error("All Groq models exhausted");
}

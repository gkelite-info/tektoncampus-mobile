import Constants from 'expo-constants';

const GROQ_MODELS = [
  "groq/compound",
  "groq/compound-mini",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768",
  "gemma-7b-it"
];



const getApiKey = () => {
  return process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || Constants.expoConfig?.extra?.groqApiKey || "";
};

async function callGroqREST(systemPrompt: string, userPrompt: string, maxTokens = 1000): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("GROQ_API_KEY is not configured.");
        return "AI features are currently unavailable (Missing API Key).";
    }

    for (const model of GROQ_MODELS) {
        // Skip compound models as they are virtual abstractions in specific SDKs, use raw models
        const actualModel = model.startsWith("groq/") ? "llama3-70b-8192" : model;

        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: actualModel,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    max_tokens: maxTokens,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                if (response.status === 429) continue; 
                throw new Error(`Groq API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content || "";
            
        } catch (error) {
            console.warn(`Groq Model ${model} failed, trying next...`, error);
        }
    }

    throw new Error("All Groq models exhausted or failed");
}



export async function generateProfileSummary(details: any): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
        const systemPrompt = `You are an expert ATS-friendly resume writer. Your job is to create a professional, engaging, and highly concise profile summary (max 3-4 sentences).`;
        const userPrompt = `Write a profile summary for this individual based on the following details:\n\n${JSON.stringify(details, null, 2)}\n\nDo not include any formatting, markdown, or intro text. Just return the summary paragraph.`;
        
        const summary = await callGroqREST(systemPrompt, userPrompt, 500);
        return { success: true, data: summary.trim() };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function suggestSkills(category: string, currentSkills: string[]): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const systemPrompt = `You are a career advisor. Provide a comma-separated list of exactly 5 relevant ${category} skills the user should consider learning next, based on what they already know. Return ONLY the comma-separated list, no other text.`;
        const userPrompt = `Current ${category} skills: ${currentSkills.length > 0 ? currentSkills.join(", ") : "None specified"}`;
        
        const res = await callGroqREST(systemPrompt, userPrompt, 100);
        const skills = res.split(",").map(s => s.trim()).filter(Boolean);
        return { success: true, data: skills };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function suggestLanguages(currentLanguages: string[]): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const systemPrompt = `You are a linguistic guide. Suggest 3 useful languages (spoken/human languages) for a professional to learn. Return ONLY a comma-separated list.`;
        const userPrompt = `Current languages known: ${currentLanguages.length > 0 ? currentLanguages.join(", ") : "None specified"}`;
        
        const res = await callGroqREST(systemPrompt, userPrompt, 50);
        const langs = res.split(",").map(s => s.trim()).filter(Boolean);
        return { success: true, data: langs };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function suggestProjectTools(projectDescription: string): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
        const systemPrompt = `You are a technical architect. Suggest a comma-separated list of 5 modern technologies, frameworks, or tools that would be best suited to build the project described. Return ONLY the comma-separated list.`;
        const userPrompt = `Project Description: ${projectDescription}`;
        
        const res = await callGroqREST(systemPrompt, userPrompt, 100);
        const tools = res.split(",").map(s => s.trim()).filter(Boolean);
        return { success: true, data: tools };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

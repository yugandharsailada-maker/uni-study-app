import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import { toast } from "sonner";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface ExtractedSubject {
    name: string;
    code: string;
    credits: number;
    gradingWeights?: {
        midsem: number;
        endsem: number;
        assignments: number;
    };
}

export function useGemini() {
    const [isExtracting, setIsExtracting] = useState(false);

    const extractSyllabusData = async (text: string): Promise<ExtractedSubject[] | null> => {
        if (!API_KEY) {
            toast.error("Gemini API Key missing. Please set VITE_GEMINI_API_KEY in .env.local");
            return null;
        }

        setIsExtracting(true);
        try {
            const genAI = new GoogleGenerativeAI(API_KEY);

            // Use the ListModels API to discover available models
            console.log("🔍 Discovering available models...");

            let model = null;

            try {
                // Fetch the list of available models
                const modelsResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
                );

                if (!modelsResponse.ok) {
                    throw new Error(`Failed to list models: ${modelsResponse.statusText}`);
                }

                const modelsData = await modelsResponse.json();
                console.log("Available models:", modelsData.models?.map((m: any) => m.name) || []);

                // Find a model that supports generateContent
                const compatibleModel = modelsData.models?.find((m: any) =>
                    m.supportedGenerationMethods?.includes('generateContent')
                );

                if (compatibleModel) {
                    // Extract just the model name (e.g., "gemini-pro" from "models/gemini-pro")
                    const modelName = compatibleModel.name.replace('models/', '');
                    console.log(`✅ Using model: ${modelName}`);
                    model = genAI.getGenerativeModel({ model: modelName });
                } else {
                    throw new Error("No models support generateContent");
                }
            } catch (err: any) {
                console.warn("⚠️ ListModels failed (likely CORS in production), using fallback model...", err.message);

                // Fallback: Just use gemini-pro directly without testing (to avoid CORS)
                const fallbackModel = "gemini-pro";
                console.log(`Using fallback model: ${fallbackModel}`);
                model = genAI.getGenerativeModel({ model: fallbackModel });
            }

            const prompt = `
        You are an expert academic assistant. Extract a list of subjects from the following syllabus text.
        For each subject, identify:
        - The subject name (full name)
        - The subject code (e.g., CS101, MATH202) - if not present, generate one from the subject name
        - The number of credits (as a number) - if not present, default to 3

        Return the data strictly as a JSON array of objects with this structure:
        [
          {
            "name": "string",
            "code": "string",
            "credits": number
          }
        ]

        IMPORTANT: Return ONLY the JSON array, nothing else. No explanations, no markdown formatting.

        Syllabus Text:
        ${text}
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            // Clean up the response - remove markdown code blocks and extra whitespace
            let jsonText = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

            // Try to find JSON array if it's embedded in other text
            const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                jsonText = jsonMatch[0];
            }

            console.log("Cleaned JSON:", jsonText); // Debug log

            const extractedData = JSON.parse(jsonText) as ExtractedSubject[];

            if (!Array.isArray(extractedData) || extractedData.length === 0) {
                throw new Error("No subjects found in the text");
            }

            toast.success(`Successfully extracted ${extractedData.length} subjects!`);
            return extractedData;
        } catch (error: any) {
            console.error("Gemini Extraction Error:", error);
            const errorMessage = error?.message || "Unknown error";

            if (errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
                toast.error("Invalid API Key", { description: "Please check your Gemini API key in .env.local" });
            } else if (errorMessage.includes("JSON")) {
                toast.error("Failed to parse AI response", { description: "The AI returned invalid data. Try rephrasing your text." });
            } else if (errorMessage.includes("No compatible")) {
                toast.error("No Compatible Model Found", { description: "Your API key doesn't have access to any supported Gemini models. Try generating a new key." });
            } else {
                toast.error("Extraction Failed", { description: errorMessage });
            }

            return null;
        } finally {
            setIsExtracting(false);
        }
    };

    return {
        extractSyllabusData,
        isExtracting,
    };
}

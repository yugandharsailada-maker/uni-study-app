// @ts-expect-error: Deno URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Fix for IDE errors when Deno is not correctly detected
declare const Deno: { env: { get: (key: string) => string | undefined } };

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        })
    }

    try {
        const { text } = await req.json()

        if (!text) {
            return new Response(
                JSON.stringify({ error: 'Text is required' }),
                { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured in Edge Function' }),
                { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
            )
        }

        // Use ONLY stable flash models to avoid "limit 0" restricted models
        const modelName = 'gemini-1.5-flash';

        const prompt = `Extract all subjects from the syllabus below.

Return ONLY valid JSON.

Format:
[
  {
    "code": "string",
    "name": "string",
    "credits": number
  }
]

Syllabus:
${text}`;

        // Using v1beta endpoint which often supports more models than v1 stable
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 1, // Minimize variation
                    response_mime_type: "application/json",
                }
            })
        })

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json().catch(() => ({ error: { message: 'Unknown Gemini Error' } }));
            throw new Error(errorData.error?.message || `Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json()
        const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

        if (!rawText) {
            throw new Error("AI returned an empty response. Please try with more specific text.");
        }

        // Robust JSON extraction
        let extractedData;
        try {
            extractedData = JSON.parse(rawText.trim());
        } catch (parseError) {
            console.error("JSON Parse Error:", rawText);
            throw new Error("Could not parse AI response as valid subject data. Try again with clearer text.");
        }

        return new Response(
            JSON.stringify({ subjects: extractedData, modelUsed: modelName }),
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )

    } catch (error: unknown) {
        console.error('Extraction Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during extraction.'
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        )
    }
})

// @ts-expect-error: Deno URL import
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Fix for IDE errors when Deno is not correctly detected
declare const Deno: { env: { get: (key: string) => string | undefined } };

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            throw new Error("No text provided");
        }

        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

        // MOCK RESPONSE IF NO API KEY (For Development)
        if (!OPENAI_API_KEY) {
            console.warn("No OPENAI_API_KEY set. Returning mock data.");
            // Simulated delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            return new Response(JSON.stringify({
                name: "AI Parsed Subject",
                code: "AI-101",
                credits: 4,
                weightages: { midsem: 30, endsem: 50 },
                assignments: [
                    { name: "Assignment 1", weight: 10 },
                    { name: "Assignment 2", weight: 10 }
                ],
                exams: [
                    { type: "midsem", weight: 30 },
                    { type: "endsem", weight: 50 }
                ],
                topics: [
                    { title: "Understand the user requirements", importance: "high", estimatedHours: 2 },
                    { title: "Design the database schema", importance: "high", estimatedHours: 4 },
                    { title: "Implement the API endpoints", importance: "medium", estimatedHours: 6 },
                    { title: "Write unit tests", importance: "low", estimatedHours: 3 }
                ]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a syllabus parser. Extract the following JSON structure from the text:
            {
              "name": "Subject Name",
              "code": "Subject Code",
              "credits": number,
              "weightages": { "midsem": number, "endsem": number },
              "assignments": [ { "name": "Name", "weight": number } ],
              "exams": [ { "type": "midsem" | "endsem", "weight": number } ],
              "topics": [ 
                  { 
                      "title": "Concise Topic Title", 
                      "importance": "high" | "medium" | "low",
                      "estimatedHours": number 
                  } 
              ]
            }
            Ensure weightages sum to roughly 100 if possible. Infer missing weights.
            Extract 5-10 key study topics based on the syllabus.
            Return ONLY validated JSON.`
                    },
                    {
                        role: 'user',
                        content: text.substring(0, 4000) // Limit context
                    }
                ],
                temperature: 0.1,
            }),
        });

        const data = await response.json();
        const content = data.choices[0].message.content;

        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

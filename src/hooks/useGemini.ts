import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export interface ExtractionRecord {
    id: string;
    user_id: string;
    content: string;
    subjects: ExtractedSubject[];
    created_at: string;
}

export function useGemini() {
    const { isGuestMode } = useAuth();
    const [isExtracting, setIsExtracting] = useState(false);
    const [history, setHistory] = useState<ExtractionRecord[]>([]);

    const fetchExtractionHistory = async (): Promise<ExtractionRecord[] | null> => {
        if (isGuestMode) return [];
        try {
            const { data, error } = await supabase.rpc('get_my_ai_extracts');

            if (error) {
                console.error("DEBUG: Error fetching extraction history:", error);
                return null;
            }

            setHistory(data as unknown as ExtractionRecord[]);
            return data as unknown as ExtractionRecord[];
        } catch (error) {
            console.error("DEBUG: Unexpected error in fetchExtractionHistory:", error);
            return null;
        }
    };

    const extractSyllabusData = async (text: string): Promise<ExtractedSubject[] | null> => {
        setIsExtracting(true);
        if (isGuestMode) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockData: ExtractedSubject[] = [
                { name: 'Data Structures', code: 'CS101', credits: 4 },
                { name: 'Algorithms', code: 'CS102', credits: 3 },
                { name: 'Database Systems', code: 'CS201', credits: 4 }
            ];
            toast.success('Extracted 3 subjects (Guest Mode Mock)');
            setIsExtracting(false);
            return mockData;
        }
        try {
            console.log("DEBUG: Sending extraction request for text length:", text.length);

            const { data, error } = await supabase.functions.invoke('extract-subjects', {
                body: { text: text.trim() }
            });

            if (error) {
                console.error("DEBUG: Supabase Invoke Error Object:", error);

                let errorMsg = error.message || 'The extraction service encountered an error.';

                // Inspecting context for deeper error details if available
                const err = error as unknown as { context?: { json: () => Promise<{ error?: string; message?: string }> } };
                if (err.context && typeof err.context.json === 'function') {
                    try {
                        const body = await err.context.json();
                        console.error("DEBUG: Error Body from Edge Function:", body);
                        errorMsg = body.error || body.message || errorMsg;
                    } catch (e) {
                        console.warn("DEBUG: Could not parse error body", e);
                    }
                }

                throw new Error(errorMsg);
            }

            if (!data || data.error) {
                throw new Error(data?.error || 'No subjects returned from Edge Function');
            }

            if (!data.subjects) {
                throw new Error('Malformed response: "subjects" field missing.');
            }

            const extractedData = data.subjects as ExtractedSubject[];

            if (!Array.isArray(extractedData) || extractedData.length === 0) {
                throw new Error("The AI couldn't find any subjects in that text. Try pasting it as plain text.");
            }

            console.log(`✅ Extracted ${extractedData.length} subjects using model: ${data.modelUsed || 'unknown'}`);
            toast.success(`Successfully extracted ${extractedData.length} subjects!`);

            // Refresh history after a successful extraction
            // Note: This assumes the edge function or a DB trigger handles the save
            fetchExtractionHistory();

            return extractedData;
        } catch (error: unknown) {
            console.error("DEBUG: Caught Extraction Error:", error);

            const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";

            // Log project for verification
            console.log("DEBUG: Current Supabase URL:", import.meta.env.VITE_SUPABASE_URL);

            if (errorMessage.includes("API key") || errorMessage.includes("API_KEY") || errorMessage.includes("configuration")) {
                toast.error("AI Configuration Error", {
                    description: "Check your Gemini API key in Supabase Dashboard secrets."
                });
            } else if (errorMessage.includes("JSON") || errorMessage.includes("valid subject data")) {
                toast.error("Failed to parse subjects", {
                    description: "The AI returned invalid data. Try pasting it as plain text."
                });
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
        fetchExtractionHistory,
        isExtracting,
        history,
    };
}

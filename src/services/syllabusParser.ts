import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker (use a CDN for simplicity with Vite without complex copying)
// Or use the installed node_modules path if Vite handles it. 
// For stability in this environment, CDN for the worker is often safer.
// Using unpkg matching the version we installed. Assuming latest stable.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface AI_SyllabusResponse {
    name: string;
    code: string;
    credits: number;
    weightages: {
        midsem: number;
        endsem: number;
    };
    assignments: Array<{
        name: string;
        weight: number;
        maxMarks?: number;
    }>;
    exams: Array<{
        type: 'midsem' | 'endsem';
        weight: number;
    }>;
    topics: Array<{
        title: string;
        importance: 'high' | 'medium' | 'low';
        estimatedHours: number;
    }>;
}

export const extractTextLocally = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        // Limit to first 5 pages to save tokens and time
        const maxPages = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += `\n--- Page ${i} ---\n${pageText}`;
        }

        return fullText;
    } catch (error) {
        console.error('PDF Extraction Error:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

export const parseSyllabusWithAI = async (text: string): Promise<AI_SyllabusResponse> => {
    const { data, error } = await supabase.functions.invoke('parse-syllabus', {
        body: { text },
    });

    if (error) {
        console.error('Edge Function Error:', error);
        throw new Error('AI Parsing Failed: ' + error.message);
    }

    return data;
};

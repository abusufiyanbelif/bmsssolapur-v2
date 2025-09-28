'use server';
/**
 * @fileOverview A Genkit flow for extracting structured lead details from a block of raw text.
 * 
 * - extractLeadDetailsFromText - a function that performs data extraction from text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractLeadDetailsFromTextInputSchema,
    ExtractLeadDetailsFromTextInput,
    ExtractLeadDetailsOutputSchema,
    ExtractLeadDetailsOutput,
} from '@/ai/schemas';

export async function extractLeadDetailsFromText(input: ExtractLeadDetailsFromTextInput): Promise<ExtractLeadDetailsOutput> {
  return extractLeadDetailsFromTextFlow(input);
}


const extractLeadDetailsFromTextFlow = ai.defineFlow(
  {
    name: 'extractLeadDetailsFromTextFlow',
    inputSchema: ExtractLeadDetailsFromTextInputSchema,
    outputSchema: ExtractLeadDetailsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-pro'),
        prompt: `You are an expert data entry assistant for a charity organization. Analyze the provided block of text, which may come from various documents like ID cards, medical bills, PDFs, or handwritten notes. Your task is to carefully extract structured details from the text. Be precise. If you cannot find a valid value for a field, you MUST omit the field entirely from your JSON output. Do not output fields with "null" or "N/A" as their value.

            **IMPORTANT CONTEXT (MUST BE USED FOR STORY/HEADLINE):**
            - **Lead Purpose**: ${input.purpose || 'Not specified'}
            - **Lead Category**: ${input.category || 'Not specified'}
            - **Degree/Class**: ${input.degree || 'Not specified'}
            - **Year**: ${input.year || 'Not specified'}
            - **Semester**: ${input.semester || 'Not specified'}

            **KEY INSTRUCTIONS:**

            **1. Generate a Compelling Story & Headline:**
            -   **Story**: Based on the document text AND the provided context (Purpose, Category, Degree, Year, Semester), synthesize a detailed narrative for the 'story' field. This should be suitable for a public audience. For example, if the context is '1st Year' and 'B.Pharm', the story MUST clearly state this, e.g., "This student is in their first year of B.Pharm and needs help...". DO NOT invent details that contradict the context, such as saying 'final year' if the context says 'first year'.
            -   **Headline**: Create a short, one-sentence summary for the 'headline' field based on the story and context. It MUST be consistent with the provided context.

            **2. Medical Document Parsing:**
            If the context purpose is 'Medical' or the document contains terms like "Hospital", "Patient", "Doctor", "Report":
            -   **Disease Identification**: Search for labels like "Diagnosis:", "Impression:", "Findings:", or "Condition:". The text following these labels is the 'diseaseIdentified'.
            -   **Disease Stage**: Search for keywords like "Stage I", "Stage II", "Grade 3", "Chronic", "Acute". The found value should be set to 'diseaseStage'.
            -   **Disease Seriousness**: Infer the 'diseaseSeriousness' ("High", "Moderate", "Low"). "High" for "malignancy", "critical", "urgent attention required", "severe".

            **3. Aadhaar Card Parsing (Beneficiary Details):**
            If the text appears to be from an Aadhaar card (contains "Government of India", "Unique Identification Authority of India", "AADHAAR"):
            -   **Full Name**: Find the beneficiary's full name.
            -   **Name Parsing**: Split the full name into 'beneficiaryFirstName', 'beneficiaryMiddleName', and 'beneficiaryLastName'. The first word is the first name, the last is the last name, and anything in between is the middle name.
            -   **Father's Name**: Look for "S/O" or "C/O" labels first. If not found, and the beneficiary has a middle name, you can assume the middle name is the father's name for the 'fatherName' field.
            -   **Date of Birth & Gender**: Extract from "DOB", "Date of Birth", "जन्म तारीख", "Gender", or "पुरुष / MALE" labels. **The 'dateOfBirth' MUST be formatted as a full ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).**
            -   **Address & Phone**: Extract the full address block and any 10-digit mobile number.
            -   **Aadhaar Number**: You MUST find the 12-digit number (often grouped in 4s).

            **4. General Document Parsing:**
            - **Amount & Dates**: Look for any monetary values (for 'amount'). Extract dates for 'caseReportedDate' or 'dueDate'. **All extracted dates MUST be formatted as a full ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).**
            
            **--- FIELDS TO EXTRACT (Populate as many as possible) ---**
            
            **Case Fields:**
            - headline, story, diseaseIdentified, diseaseStage, diseaseSeriousness, purpose, category, amount, dueDate, caseReportedDate, caseDetails
            
            **Beneficiary Fields:**
            - beneficiaryFirstName, beneficiaryMiddleName, beneficiaryLastName, fatherName, dateOfBirth, gender, beneficiaryPhone, address, aadhaarNumber, panNumber
            
            **Raw Text to Analyze:**
            ---
            ${input.rawText}
            ---
            `,
        output: {
            schema: ExtractLeadDetailsOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI model did not return any output from the text.");
    }

    return output;
  }
);

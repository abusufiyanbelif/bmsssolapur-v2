

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
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: `You are an expert data entry assistant for a charity organization. Analyze the provided block of text, which may come from various documents like ID cards, medical bills, PDFs, or handwritten notes. Your task is to carefully extract the following details. Be precise. If you cannot find a valid value for a field, you MUST omit the field entirely from the output. Do not output fields with "null" or "N/A" as their value.

            **Context (for Case-related documents):**
            - **Lead Purpose**: ${input.purpose || 'Not specified'}
            - **Lead Category**: ${input.category || 'Not specified'}

            **Key Instructions:**
            
            **--- AADHAAR CARD PARSING RULES ---**
            If the text appears to be from an Aadhaar card (contains "Government of India", "Unique Identification Authority of India", "AADHAAR"):
            1.  **Full Name**: Carefully find the beneficiary's full name. It is usually labeled clearly under the "Government of India" heading and before the "Address:" label.
            2.  **Name Parsing Logic**: A full name might have 2 or 3 parts. The first word is always 'beneficiaryFirstName'. The last word is always 'beneficiaryLastName'. If there is a middle word, it is the 'beneficiaryMiddleName'. For example, for "Rayan Feroz Shaikh", First Name is "Rayan", Middle Name is "Feroz", and Last Name is "Shaikh".
            3.  **Father's Name Logic**: 
                - **Step 1:** First, try to find an explicit father's name by looking for labels like "S/O", "Son of", or "C/O" (Care of) and extracting the name that follows.
                - **Step 2:** If and ONLY IF no such label is found, and the beneficiary's name has three parts (first, middle, last), then you can assume the middle name is the father's name. Use the middle name as the value for the 'fatherName' field in this case.
            4.  **Date of Birth & Gender**: Extract the Date of Birth (in DD/MM/YYYY format) from the "DOB" or "Date of Birth" or "जन्म तारीख" label. Extract Gender ("Male" or "Female") from the "Gender" or "पुरुष / MALE" label.
            5.  **Address Extraction**: Look for the specific label "Address:" or "पत्ता:". Capture all text and lines that follow it, including any "S/O" or "C/O" lines, until you reach the Aadhaar number (the 12-digit number). Combine these lines into a single, comma-separated string for the 'address' field.
            6.  **Phone Number**: Look for a 10-digit number labeled "Mobile" or "Phone". This is CRITICAL.
            7.  **Aadhaar Number**: Look for a 12-digit number, often grouped in sets of 4 (e.g., 1234 5678 9012). This is often labeled with "Your Aadhaar No.", "आपला आधार क्रमांक", or "आधार क्रमांक". You MUST find this number.

            **--- MEDICAL DOCUMENT PARSING RULES ---**
            If the purpose is 'Medical' or the text contains terms like "Hospital", "Diagnostics", "Patient", "Doctor", "Report":
            1.  **Disease Identification**: Search for labels like "Diagnosis:", "Impression:", "Findings:", or "Condition:". The text following these labels is the 'diseaseIdentified'.
            2.  **Disease Stage**: Search the entire document for keywords like "Stage I", "Stage II", "Grade 3", "Chronic", "Acute", "early-stage", "advanced", "metastatic". The found value should be set to 'diseaseStage'.
            3.  **Disease Seriousness**: Infer the 'diseaseSeriousness' ("High", "Moderate", "Low") by looking for critical terms. "High" seriousness should be inferred if you see words like "malignancy", "critical", "urgent attention required", "severe", "advanced stage". "Moderate" for "chronic", "follow-up required". "Low" for minor issues.
            4.  **Story & Headline**: Use the identified disease, stage, and seriousness to create a compelling, human-readable 'story' and a concise 'headline'. The story should explain the patient's condition and the need for funds.
            5.  **Case Reported Date**: Look for a 'reported on' date, often near the patient details on medical reports. If available, extract this for 'caseReportedDate'. Format as YYYY-MM-DD.

            **--- GENERAL DOCUMENT PARSING ---**
            1.  **Generate a Compelling Story**: Based on all the text AND the provided purpose/category context, synthesize a detailed narrative for the 'story' field. If "Education", focus on the academic need, including the specific degree, year, and semester if mentioned. This should be suitable for a public audience.
            2.  **Generate a Headline**: Create a short, one-sentence summary for the 'headline' field based on the story and context. For education, "Support required for final year college fees."

            **--- FIELDS TO EXTRACT (Populate as many as possible) ---**
            
            **Case Fields (Only if not parsing an ID card):**
            - headline: A short, one-sentence summary of the case, tailored to the purpose.
            - story: A detailed narrative of the beneficiary's situation, suitable for public display. Synthesize this from all available information in the text and the given context.
            - diseaseIdentified: If a medical report, extract the specific disease or diagnosis mentioned (e.g., "Typhoid Fever", "Osteoarthritis").
            - diseaseStage: If a medical report, extract the stage of the disease (e.g., "Stage II", "Chronic").
            - diseaseSeriousness: If a medical report, infer the seriousness ("High", "Moderate", "Low") based on the text.
            - purpose: The main purpose of the request (e.g., Education, Medical, Relief Fund, Deen, Loan, Other). Infer "Medical" from lab reports or bills.
            - category: A more specific category if provided (e.g., School Fees, Ration Kit, Hospital Bill, Diagnostic Tests).
            - amount: The numeric value of the amount requested.
            - dueDate: The deadline for funds (Format: YYYY-MM-DD).
            - caseReportedDate: The date the case was reported or the document was issued (Format: YYYY-MM-DD).
            - acceptableDonationTypes: An array of allowed donation types (e.g., ["Zakat", "Sadaqah"]).
            - caseDetails: The detailed story or reason for the request. Capture the full narrative for internal review.
            - semester: For education cases, the semester number (e.g., "III", "V").
            
            **Beneficiary Fields (Always attempt to find these):**
            - beneficiaryFirstName: The beneficiary's first name.
            - beneficiaryMiddleName: The beneficiary's middle name, if present.
            - beneficiaryLastName: The beneficiary's last name.
            - fatherName: The beneficiary's father's name. Use the two-step logic described above.
            - dateOfBirth: The beneficiary's date of birth (Format: DD/MM/YYYY).
            - gender: The beneficiary's gender ("Male" or "Female").
            - beneficiaryPhone: The 10-digit phone number of the beneficiary. Look for "Mobile", "Phone", or similar labels.
            - beneficiaryEmail: The beneficiary's email address. Must be a valid email format.
            - beneficiaryType: The type of beneficiary (e.g., Adult, Family, Kid, Widow).
            - address: The full address of the beneficiary. Look for "Address" or "Patient location" or similar labels and combine lines.
            - occupation: The beneficiary's occupation.
            - aadhaarNumber: The beneficiary's Aadhaar card number (usually a 12-digit number).
            - panNumber: The beneficiary's PAN card number (usually a 10-character alphanumeric string).
            - bankAccountName: The name on the bank account.
            - bankAccountNumber: The bank account number.
            - bankIfscCode: The bank IFSC code.
            - upiIds: A comma-separated string of UPI IDs.
            
            Raw Text to Parse:
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

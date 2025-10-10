
'use server';
/**
 * @fileOverview A Genkit flow for generating a monthly update message.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'zod';
import { getSafeGeminiModel } from '@/services/gemini-service';

export const MonthlyUpdateInputSchema = z.object({
  month: z.string().describe("The month and year for the report (e.g., 'August 2024')."),
  totalDonated: z.number().describe("Total amount donated in the last month."),
  casesClosed: z.number().describe("Number of help cases closed in the last month."),
  fundsDistributed: z.number().describe("Total amount of funds distributed to beneficiaries in the last month."),
  beneficiariesHelped: z.number().describe("Number of unique beneficiaries helped in the last month."),
});
export type MonthlyUpdateInput = z.infer<typeof MonthlyUpdateInputSchema>;

export const MonthlyUpdateOutputSchema = z.object({
    text: z.string().describe("The full, formatted WhatsApp message."),
});
export type MonthlyUpdateOutput = z.infer<typeof MonthlyUpdateOutputSchema>;

export const generateMonthlyUpdate = ai.defineFlow(
  {
    name: 'generateMonthlyUpdateFlow',
    inputSchema: MonthlyUpdateInputSchema,
    outputSchema: MonthlyUpdateOutputSchema,
  },
  async (input) => {
    const modelName = await getSafeGeminiModel();
    const { text: llmResponseText } = await ai.generate({
        model: googleAI.model(modelName),
        prompt: `
            You are a communications assistant for a charity organization called "Baitul Mal Samajik Sanstha (Solapur)".
            Your task is to generate a concise, positive, and informative monthly update message for WhatsApp to be sent to donors and supporters.

            Use the following statistics for the month of ${input.month}:
            - Total Donations Received: ₹${input.totalDonated.toLocaleString('en-IN')}
            - Cases Closed: ${input.casesClosed}
            - Funds Distributed to Beneficiaries: ₹${input.fundsDistributed.toLocaleString('en-IN')}
            - Unique Beneficiaries Helped: ${input.beneficiariesHelped}
            
            Craft a message that follows this structure:
            1.  Start with a warm Islamic greeting like "Assalamualaikum Warahmatullahi Wabarakatuh".
            2.  Announce the monthly update for ${input.month}.
            3.  Present the key statistics in a clear, bulleted list using WhatsApp formatting (e.g., *bold* for labels).
            4.  Include a heartfelt "Thank You" message to the donors for their trust and support.
            5.  End with a call to action, encouraging them to view open cases on the website.
            6.  Conclude with regards from the organization.
            
            Keep the tone appreciative and inspiring.
        `,
    });

    return { text: llmResponseText };
  }
);

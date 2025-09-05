

/**
 * @fileOverview Centralized Zod schemas and TypeScript types for Genkit flows.
 */

import { z } from 'zod';

// Schema for sending an OTP
export const SendOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export const SendOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was sent successfully.'),
  error: z.string().optional().describe('The error message if the OTP failed to send.'),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

// Schema for verifying an OTP
export const VerifyOtpInputSchema = z.object({
    phoneNumber: z.string().describe('The phone number the OTP was sent to.'),
    code: z.string().describe('The OTP code to verify.'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

export const VerifyOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was verified successfully.'),
  error: z.string().optional().describe('The error message if verification failed.'),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

// Schema for sending an email
export const SendEmailInputSchema = z.object({
  to: z.string().describe('The recipient email address.'),
  subject: z.string().describe('The subject of the email.'),
  body: z.string().describe('The body of the email (can be plain text or HTML).'),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export const SendEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was sent successfully.'),
  error: z.string().optional().describe('The error message if the email failed to send.'),
});
export type SendEmailOutput = z.infer<typeof SendEmailOutputSchema>;

// Schema for sending a WhatsApp message
export const SendWhatsappInputSchema = z.object({
  to: z.string().describe('The recipient phone number in E.164 format.'),
  body: z.string().describe('The body of the WhatsApp message.'),
});
export type SendWhatsappInput = z.infer<typeof SendWhatsappInputSchema>;

export const SendWhatsappOutputSchema = z.object({
  success: z.boolean().describe('Whether the message was sent successfully.'),
  error: z.string().optional().describe('The error message if the message failed to send.'),
});
export type SendWhatsappOutput = z.infer<typeof SendWhatsappOutputSchema>;


// Schema for Configuration Validator
export const ValidateConfigurationInputSchema = z.object({
  firebaseConfig: z
    .string()
    .describe('The Firebase configuration as a JSON string.'),
  externalServiceConfigs: z
    .string()
    .describe('The external services configurations as a JSON string.'),
});
export type ValidateConfigurationInput = z.infer<typeof ValidateConfigurationInputSchema>;

export const ValidateConfigurationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the configuration is valid or not.'),
  errors: z.array(z.string()).describe('A list of potential misconfigurations or security vulnerabilities.'),
});
export type ValidateConfigurationOutput = z.infer<typeof ValidateConfigurationOutputSchema>;


// Schema for Quotes
export const QuoteSchema = z.object({
  id: z.string().describe('The unique ID of the quote.'),
  number: z.number().describe('A sequential number for the quote within its category.'),
  text: z.string().describe('The text of the quote.'),
  source: z.string().describe('The source of the quote (e.g., Quran 2:261, Sahih al-Bukhari, Imam Al-Ghazali).'),
  category: z.string().describe('The category of the quote (e.g., Quran, Hadith).'),
  categoryTypeNumber: z.number().describe('A number representing the category (1: Quran, 2: Hadith, 3: Scholar).'),
});
export type Quote = z.infer<typeof QuoteSchema>;

// Schema for extracting lead details from text
export const ExtractLeadDetailsFromTextInputSchema = z.object({
  rawText: z.string().describe("A block of raw text containing lead details to be parsed."),
});
export type ExtractLeadDetailsFromTextInput = z.infer<typeof ExtractLeadDetailsFromTextInputSchema>;

export const ExtractLeadDetailsOutputSchema = z.object({
    // Lead fields
    headline: z.string().optional().describe("A short, one-sentence summary of the case."),
    purpose: z.string().optional().describe("The main purpose of the request (e.g., Education, Medical)."),
    category: z.string().optional().describe("The specific category for the purpose (e.g., School Fees, Hospital Bill)."),
    amount: z.number().optional().describe("The amount requested."),
    dueDate: z.string().optional().describe("The date by which the funds are needed (YYYY-MM-DD)."),
    acceptableDonationTypes: z.array(z.string()).optional().describe("A list of donation types, e.g., ['Zakat', 'Sadaqah']."),
    caseDetails: z.string().optional().describe("The detailed reason or story for the help request."),
    // Beneficiary fields
    beneficiaryName: z.string().optional().describe("The full name of the beneficiary."),
    beneficiaryPhone: z.string().optional().describe("The 10-digit phone number of the beneficiary."),
    fatherName: z.string().optional().describe("The beneficiary's father's name."),
    beneficiaryEmail: z.string().email().optional().describe("The beneficiary's email address."),
    beneficiaryType: z.string().optional().describe("The type of beneficiary (e.g., Adult, Family, Kid, Widow)."),
    address: z.string().optional().describe("The full address of the beneficiary."),
    occupation: z.string().optional().describe("The beneficiary's occupation."),
    aadhaarNumber: z.string().optional().describe("The beneficiary's Aadhaar card number."),
    panNumber: z.string().optional().describe("The beneficiary's PAN card number."),
    bankAccountName: z.string().optional().describe("The name on the beneficiary's bank account."),
    bankAccountNumber: z.string().optional().describe("The beneficiary's bank account number."),
    bankIfscCode: z.string().optional().describe("The beneficiary's bank IFSC code."),
    upiIds: z.string().optional().describe("A comma-separated list of the beneficiary's UPI IDs."),
    // Referral fields
    referralName: z.string().optional().describe("The name of the person who referred the case."),
    referralPhone: z.string().optional().describe("The phone number of the person who referred the case."),
});
export type ExtractLeadDetailsOutput = z.infer<typeof ExtractLeadDetailsOutputSchema>;

// Schema for extracting raw text from an image
export const ExtractRawTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRawTextInput = z.infer<typeof ExtractRawTextInputSchema>;

export const ExtractRawTextOutputSchema = z.object({
    rawText: z.string().describe("The full, raw text extracted from the image.")
});
export type ExtractRawTextOutput = z.infer<typeof ExtractRawTextOutputSchema>;

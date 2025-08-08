

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
  text: z.string().describe('The text of the quote.'),
  source: z.string().describe('The source of the quote (e.g., Quran 2:261, Sahih al-Bukhari, Imam Al-Ghazali).'),
  category: z.enum(['Quran', 'Hadith', 'Scholar']).describe('The category of the quote.')
});
export type Quote = z.infer<typeof QuoteSchema>;

export const QuotesOutputSchema = z.object({
  quotes: z.array(QuoteSchema).describe('An array of inspirational quotes.'),
});
export type QuotesOutput = z.infer<typeof QuotesOutputSchema>;


// Schema for extracting donation details from an image
export const ExtractDonationDetailsInputSchema = z.object({
    photoDataUri: z
    .string()
    .describe(
      "A photo of a payment screenshot, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractDonationDetailsInput = z.infer<typeof ExtractDonationDetailsInputSchema>;

export const ExtractDonationDetailsOutputSchema = z.object({
  amount: z.number().optional().describe('The primary transaction amount. It must be a number.'),
  transactionId: z.string().optional().describe("The Transaction ID, Order ID, or reference number. If multiple IDs are present, prefer the one labeled 'Transaction ID' or 'Reference No.'."),
  utrNumber: z.string().optional().describe("The UTR number if it is explicitly visible. It's often a long number."),
  date: z.string().optional().describe('The date of the transaction. Format it as YYYY-MM-DD.'),
  time: z.string().optional().describe('The time of the transaction. Format it as hh:mm am/pm.'),
  paymentApp: z.string().optional().describe('The method or app of payment (e.g., UPI, Bank Transfer, GPay, PhonePe, Paytm). Infer this from the UI.'),
  paymentMethod: z.string().optional().describe('The specific payment method used, e.g., UPI, Bank Transfer.'),
  senderName: z.string().optional().describe("The full name of the person who sent the money (e.g., 'From John Doe')."),
  senderAccountNumber: z.string().optional().describe("The sender's bank account number or phone number, even if partial (e.g., 'From account ...1234' or '...linked to 1234567890')."),
  recipientName: z.string().optional().describe("The full name of the person who received the money (e.g., 'To Jane Doe')."),
  recipientPhone: z.string().optional().describe("The recipient's phone number if visible."),
  recipientUpiId: z.string().optional().describe("The recipient's UPI ID if visible (e.g., 'to-username@okbank')."),
  recipientAccountNumber: z.string().optional().describe("The recipient's bank account number, even if partial (e.g., 'To account ...5678')."),
  status: z.string().optional().describe('The status of the transaction (e.g., Successful, Completed, Received).'),
  notes: z.string().optional().describe('Any user-added comments, remarks, or descriptions found in the payment details.'),
});

export type ExtractDonationDetailsOutput = z.infer<typeof ExtractDonationDetailsOutputSchema>;


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

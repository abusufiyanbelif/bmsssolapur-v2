

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
  purpose: z.string().optional().describe("The user-selected purpose to give context to the AI."),
  category: z.string().optional().describe("The user-selected category to give context to the AI."),
});
export type ExtractLeadDetailsFromTextInput = z.infer<typeof ExtractLeadDetailsFromTextInputSchema>;

export const ExtractLeadDetailsOutputSchema = z.object({
    // Lead fields
    headline: z.string().optional().describe("A short, one-sentence summary of the case."),
    story: z.string().optional().describe("A detailed narrative of the beneficiary's situation, suitable for public display. Synthesize this from all available information in the text."),
    diseaseIdentified: z.string().optional().describe("If a medical report, extract the specific disease or diagnosis mentioned (e.g., 'Typhoid Fever', 'Osteoarthritis')."),
    purpose: z.string().optional().describe("The main purpose of the request (e.g., Education, Medical, Relief Fund, Deen, Loan, Other)."),
    category: z.string().optional().describe("The specific category for the purpose (e.g., School Fees, Hospital Bill)."),
    amount: z.number().optional().describe("The amount requested."),
    dueDate: z.string().optional().describe("The date by which the funds are needed (YYYY-MM-DD)."),
    caseReportedDate: z.string().optional().describe("The date the case was reported or the document was issued (YYYY-MM-DD)."),
    acceptableDonationTypes: z.array(z.string()).optional().describe("A list of donation types, e.g., ['Zakat', 'Sadaqah']."),
    caseDetails: z.string().optional().describe("The detailed reason or story for the help request."),
    // Beneficiary fields
    beneficiaryFirstName: z.string().optional().describe("The beneficiary's first name."),
    beneficiaryMiddleName: z.string().optional().describe("The beneficiary's middle name."),
    beneficiaryLastName: z.string().optional().describe("The beneficiary's last name."),
    fatherName: z.string().optional().describe("The beneficiary's father's name."),
    dateOfBirth: z.string().optional().describe("The beneficiary's date of birth (Format: DD/MM/YYYY)."),
    gender: z.enum(['Male', 'Female', 'Other']).optional().describe("The beneficiary's gender."),
    beneficiaryPhone: z.string().optional().describe("The 10-digit phone number of the beneficiary."),
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
  photoDataUris: z.array(z.string())
    .describe(
      "An array of photos of documents, as data URIs that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRawTextInput = z.infer<typeof ExtractRawTextInputSchema>;

export const ExtractRawTextOutputSchema = z.object({
    rawText: z.string().describe("The full, raw text extracted from the image.")
});
export type ExtractRawTextOutput = z.infer<typeof ExtractRawTextOutputSchema>;


// Schema for extracting donation details from an image (now combined with text extraction)
export const ExtractDetailsFromTextInputSchema = z.object({
  rawText: z.string().describe("A block of raw text from a payment receipt to be parsed."),
});
export type ExtractDetailsFromTextInput = z.infer<typeof ExtractDetailsFromTextInputSchema>;

export const ExtractDonationDetailsOutputSchema = z.object({
  amount: z.number().optional().describe('The primary transaction amount. It must be a number.'),
  transactionId: z.string().optional().describe("The primary Transaction ID, Order ID, or UPI Reference No. For Google Pay, this should be the 'UPI transaction ID'."),
  utrNumber: z.string().optional().describe("The UTR number if it is explicitly visible. It's often a long number."),
  googlePayTransactionId: z.string().optional().describe("The Google Pay specific transaction ID."),
  phonePeTransactionId: z.string().optional().describe("The PhonePe specific transaction ID."),
  paytmUpiReferenceNo: z.string().optional().describe("The Paytm specific UPI Reference No."),
  date: z.string().optional().describe('The date of the transaction. Format it as YYYY-MM-DD.'),
  time: z.string().optional().describe('The time of the transaction. Format it as hh:mm am/pm.'),
  type: z.enum(['Zakat', 'Sadaqah', 'Fitr', 'Lillah', 'Kaffarah', 'Interest', 'Any']).optional().describe("The category of donation if mentioned (e.g., Zakat, Sadaqah)."),
  purpose: z.enum(['Education', 'Medical', 'Relief Fund', 'Deen', 'Loan', 'To Organization Use', 'Loan Repayment', 'Monthly Pledge', 'Other']).optional().describe("The specific purpose of the donation if mentioned (e.g., Education, Hospital)."),
  
  paymentApp: z.string().optional().describe('The primary method or app of payment (e.g., GPay, PhonePe, Paytm). Infer this from the UI, especially logos like "पे" for PhonePe or "Paytm Bank".'),
  senderPaymentApp: z.string().optional().describe("The app the sender used (e.g., 'PhonePe')."),
  recipientPaymentApp: z.string().optional().describe("The app the recipient received money on, if specified (e.g., 'Google Pay')."),
  
  paymentMethod: z.string().optional().describe('The specific payment method used, e.g., UPI, Bank Transfer. Often found near the transaction ID.'),
  
  senderName: z.string().optional().describe("The full name of the person who sent the money, often found under a 'FROM' or 'Debited From' heading."),
  phonePeSenderName: z.string().optional().describe("The sender's name specifically from a PhonePe receipt."),
  googlePaySenderName: z.string().optional().describe("The sender's name specifically from a Google Pay receipt."),
  paytmSenderName: z.string().optional().describe("The sender's name specifically from a Paytm receipt."),

  senderUpiId: z.string().optional().describe("The sender's UPI ID if visible (e.g., 'username@okaxis'). This is often found directly under or on the next line after the sender's name and contains an '@' symbol."),
  senderAccountNumber: z.string().optional().describe("The sender's bank account number, even if partial. Look for labels like 'A/c No.', 'From account ...1234', or a phone number explicitly linked to the account like '...linked to 1234567890'. Do NOT extract a standalone phone number here."),
  
  recipientName: z.string().optional().describe("The full name of the person who received the money, often found under a 'TO' heading."),
  phonePeRecipientName: z.string().optional().describe("The recipient's name specifically from a PhonePe receipt."),
  googlePayRecipientName: z.string().optional().describe("The recipient's name specifically from a Google Pay receipt."),
  paytmRecipientName: z.string().optional().describe("The recipient's name specifically from a Paytm receipt."),

  donorPhone: z.string().optional().describe("The sender's phone number, especially if it is specified as the linked account (e.g., '...linked to 1234567890')."),
  recipientPhone: z.string().optional().describe("The recipient's phone number if visible, often near the recipient's name."),
  recipientUpiId: z.string().optional().describe("The recipient's UPI ID if visible (e.g., 'username@okhdfc'). This is often found directly under the recipient's name."),
  recipientAccountNumber: z.string().optional().describe("The recipient's bank account number, even if partial (e.g., 'To account ...5678')."),
  status: z.string().optional().describe('The status of the transaction (e.g., Successful, Completed, Received).'),
  notes: z.string().optional().describe('Any user-added comments, remarks, or descriptions found in the payment details. Also labeled as "Message".'),
});

export type ExtractDonationDetailsOutput = z.infer<typeof ExtractDonationDetailsOutputSchema>;

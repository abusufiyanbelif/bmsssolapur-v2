import { config } from 'dotenv';
config();

// import '@/ai/flows/configuration-validator.ts';
import '@/ai/flows/send-email-flow.ts';
import '@/ai/flows/send-otp-flow.ts';
import '@/ai/flows/verify-otp-flow.ts';
import '@/ai/flows/get-inspirational-quotes-flow.ts';
import '@/ai/flows/extract-donation-details-flow.ts';
import '@/ai/flows/extract-raw-text-flow.ts';
import '@/ai/flows/extract-details-from-text-flow.ts';
import '@/ai/flows/send-whatsapp-flow.ts';
import '@/ai/flows/extract-lead-details-from-text-flow.ts';

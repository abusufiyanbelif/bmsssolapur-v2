import { config } from 'dotenv';
config();

// import '@/ai/flows/configuration-validator.ts';
import '@/ai/flows/send-email-flow.ts';
import '@/ai/flows/send-otp-flow.ts';
import '@/ai/flows/verify-otp-flow.ts';
import '@/ai/flows/get-inspirational-quotes-flow.ts';
import '@/ai/flows/extract-donation-details-flow.ts';

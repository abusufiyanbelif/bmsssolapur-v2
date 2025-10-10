
import { config } from 'dotenv';
config();

// Import the 'ai' object to ensure it is initialized before flows are defined.
import '@/ai/genkit';

// This file is now the central point for importing and registering all Genkit flows.
// This resolves the circular dependency that was causing the server to crash.
import '@/ai/flows/configuration-validator';
import '@/ai/flows/extract-beneficiary-details-flow';
import '@/ai/flows/extract-donation-details-flow';
import '@/ai/flows/extract-lead-details-from-text-flow';
import '@/ai/flows/extract-raw-text-flow';
import '@/ai/flows/generate-summaries-flow';
import '@/ai/flows/get-inspirational-quotes-flow';
import '@/ai/flows/send-email-flow';
import '@/ai/flows/send-otp-flow';
import '@/ai/flows/send-whatsapp-flow';
import '@/ai/flows/verify-otp-flow';
import '@/ai/flows/generate-monthly-update-flow';

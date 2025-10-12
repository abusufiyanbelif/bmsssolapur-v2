
import { config } from 'dotenv';
config();

// This must be the first import to avoid circular dependencies.
import '@/ai/genkit';

// Import all flow files to register them with the Genkit AI instance.
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

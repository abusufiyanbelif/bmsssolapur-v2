import { config } from 'dotenv';
config();

// import '@/ai/flows/configuration-validator.ts';
import '@/ai/flows/send-email-flow.ts';
import '@/ai/flows/send-otp-flow.ts';
import '@/ai/flows/verify-otp-flow.ts';

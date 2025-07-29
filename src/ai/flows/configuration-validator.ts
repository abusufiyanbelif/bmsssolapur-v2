// configuration-validator.ts
'use server';

/**
 * @fileOverview Configuration validator flow.
 *
 * - validateConfiguration - A function that validates the Firebase and external service configurations.
 * - ValidateConfigurationInput - The input type for the validateConfiguration function.
 * - ValidateConfigurationOutput - The return type for the validateConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateConfigurationInputSchema = z.object({
  firebaseConfig: z
    .string()
    .describe('The Firebase configuration as a JSON string.'),
  externalServiceConfigs: z
    .string()
    .describe('The external services configurations as a JSON string.'),
});
export type ValidateConfigurationInput = z.infer<typeof ValidateConfigurationInputSchema>;

const ValidateConfigurationOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the configuration is valid or not.'),
  errors: z.array(z.string()).describe('A list of potential misconfigurations or security vulnerabilities.'),
});
export type ValidateConfigurationOutput = z.infer<typeof ValidateConfigurationOutputSchema>;

export async function validateConfiguration(input: ValidateConfigurationInput): Promise<ValidateConfigurationOutput> {
  return validateConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateConfigurationPrompt',
  input: {schema: ValidateConfigurationInputSchema},
  output: {schema: ValidateConfigurationOutputSchema},
  prompt: `You are a security expert specializing in identifying misconfigurations and security vulnerabilities in Firebase and external service configurations.

  Analyze the provided Firebase configuration and external service configurations for potential issues.
  Identify any misconfigurations, security vulnerabilities, or potential problems.

  Firebase Configuration:
  {{firebaseConfig}}

  External Service Configurations:
  {{externalServiceConfigs}}

  Return a JSON object with "isValid" set to true if no issues are found, or false if issues are found.
  If issues are found, populate the "errors" array with descriptions of each issue.
`,
});

const validateConfigurationFlow = ai.defineFlow(
  {
    name: 'validateConfigurationFlow',
    inputSchema: ValidateConfigurationInputSchema,
    outputSchema: ValidateConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

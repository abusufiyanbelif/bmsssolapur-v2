
// configuration-validator.ts
'use server';

/**
 * @fileOverview Configuration validator flow.
 *
 * - validateConfiguration - A function that validates the Firebase and external service configurations.
 */

import {ai} from '@/ai/genkit';
import {
  ValidateConfigurationInput,
  ValidateConfigurationInputSchema,
  ValidateConfigurationOutput,
  ValidateConfigurationOutputSchema
} from '@/ai/schemas';

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

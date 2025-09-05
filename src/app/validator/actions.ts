

"use server";

import {
  validateConfiguration,
} from "@/ai/flows/configuration-validator";
import type {
  ValidateConfigurationInput,
  ValidateConfigurationOutput,
} from "@/ai/schemas";
import { testGeminiConnection } from "@/app/services/actions";


type FormState = ValidateConfigurationOutput | null;

export async function handleValidation(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const firebaseConfig = formData.get("firebaseConfig") as string;
  const externalServiceConfigs = formData.get("externalServiceConfigs") as string;
  const geminiApiKey = formData.get("geminiApiKey") as string | undefined;

  // Perform a live connection test if a key was provided manually
  if (geminiApiKey) {
      const testResult = await testGeminiConnection(geminiApiKey);
      if (!testResult.success) {
          return {
              isValid: false,
              errors: [`Live Gemini Test Failed: ${testResult.error}`]
          }
      }
  }
  
  if (!firebaseConfig || !externalServiceConfigs) {
      return {
          isValid: false,
          errors: ["Both Firebase and External Service configurations are required."],
      };
  }
  
  const input: ValidateConfigurationInput = {
    firebaseConfig,
    externalServiceConfigs,
  };

  try {
    const result = await validateConfiguration(input);
    // Add the live test success message to the results
    if (geminiApiKey && result.isValid) {
        result.errors.push("Live Gemini API key test was successful.");
    }
    return result;
  } catch (e) {
    console.error("Validation Error:", e);
    return {
      isValid: false,
      errors: ["An unexpected error occurred while validating the configuration. Please check the server logs."],
    };
  }
}

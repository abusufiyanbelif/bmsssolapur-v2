"use server";

import {
  validateConfiguration,
  type ValidateConfigurationInput,
  type ValidateConfigurationOutput,
} from "@/ai/flows/configuration-validator";

type FormState = ValidateConfigurationOutput | null;

export async function handleValidation(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const firebaseConfig = formData.get("firebaseConfig") as string;
  const externalServiceConfigs = formData.get("externalServiceConfigs") as string;

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
    return result;
  } catch (e) {
    console.error("Validation Error:", e);
    return {
      isValid: false,
      errors: ["An unexpected error occurred while validating the configuration. Please check the server logs."],
    };
  }
}

// utils/validation.utils.ts
/**
 * Logs validation errors in a readable format
 */
export const logValidationErrors = (errors: string[]) => {
  if (errors.length > 0) {
    console.warn("⚠️ Payload validation warnings:", errors);
    errors.forEach((error, index) => {
      console.warn(`   ${index + 1}. ${error}`);
    });
  }
};

/**
 * Common error message parser for API responses
 */
export const parseApiError = (error: any): string => {
  if (!error?.message) return "Unknown error occurred";

  const message = error.message;

  if (message.includes("Cannot coerce empty String")) {
    return "Empty string sent to enum field - check data mapping";
  }

  if (message.includes("Cannot deserialize value of type")) {
    return "Type mismatch - check data structure";
  }

  if (message.includes("not one of the values accepted for Enum")) {
    return "Invalid enum value - check valid values";
  }

  if (message.includes("JSON parse error")) {
    return "Invalid JSON format - check data structure";
  }

  if (message.includes("No static resource")) {
    return "API endpoint not found - check URL and authentication";
  }

  return message;
};

/**
 * Validates that all required authentication headers are present
 */
export const validateAuthHeaders = (
  headers: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!headers.Authorization && !headers.authorization) {
    errors.push("Missing Authorization header");
  }

  const authHeader = headers.Authorization || headers.authorization;
  if (authHeader && !authHeader.startsWith("Bearer ")) {
    errors.push("Authorization header must start with 'Bearer '");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Shared Zod-like validation helpers for Edge Functions
// (Deno doesn't need npm Zod — we use lightweight manual schemas)

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

// ---- Schema builders ----

type Validator<T> = (value: unknown, field: string) => ValidationError | null;

function string(opts?: { min?: number; max?: number; optional?: boolean }) {
  return (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null) {
      if (opts?.optional) return null;
      return { field, message: `${field} is required` };
    }
    if (typeof value !== "string") return { field, message: `${field} must be a string` };
    if (opts?.min && value.length < opts.min) return { field, message: `${field} must be at least ${opts.min} characters` };
    if (opts?.max && value.length > opts.max) return { field, message: `${field} must be at most ${opts.max} characters` };
    return null;
  };
}

function boolean(opts?: { optional?: boolean }) {
  return (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null) {
      if (opts?.optional) return null;
      return { field, message: `${field} is required` };
    }
    if (typeof value !== "boolean") return { field, message: `${field} must be a boolean` };
    return null;
  };
}

function number(opts?: { min?: number; max?: number; optional?: boolean }) {
  return (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null) {
      if (opts?.optional) return null;
      return { field, message: `${field} is required` };
    }
    if (typeof value !== "number") return { field, message: `${field} must be a number` };
    if (opts?.min !== undefined && value < opts.min) return { field, message: `${field} must be >= ${opts.min}` };
    if (opts?.max !== undefined && value > opts.max) return { field, message: `${field} must be <= ${opts.max}` };
    return null;
  };
}

function array(opts?: { optional?: boolean }) {
  return (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null) {
      if (opts?.optional) return null;
      return { field, message: `${field} is required` };
    }
    if (!Array.isArray(value)) return { field, message: `${field} must be an array` };
    return null;
  };
}

function oneOf(allowed: string[], opts?: { optional?: boolean }) {
  return (value: unknown, field: string): ValidationError | null => {
    if (value === undefined || value === null) {
      if (opts?.optional) return null;
      return { field, message: `${field} is required` };
    }
    if (typeof value !== "string" || !allowed.includes(value)) {
      return { field, message: `${field} must be one of: ${allowed.join(", ")}` };
    }
    return null;
  };
}

export const v = { string, boolean, number, array, oneOf };

export function validate<T>(
  data: Record<string, unknown>,
  schema: Record<string, ReturnType<typeof string | typeof boolean | typeof number | typeof array | typeof oneOf>>
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  for (const [field, validator] of Object.entries(schema)) {
    const err = (validator as Validator<unknown>)(data[field], field);
    if (err) errors.push(err);
  }
  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: data as unknown as T };
}

// ---- Validation error response helper ----

export function validationErrorResponse(errors: ValidationError[], corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ error: "Validation failed", details: errors }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

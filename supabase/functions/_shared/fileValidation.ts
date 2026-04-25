/**
 * Magic-byte file signature validation.
 * Checks actual file content, not extension.
 */

interface FileSignature {
  mime: string;
  bytes: number[];
}

const SIGNATURES: FileSignature[] = [
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },          // %PDF
  { mime: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF] },                      // JPEG
  { mime: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47] },                 // PNG
];

const ALLOWED_MIMES = new Set(SIGNATURES.map((s) => s.mime));

export interface FileValidationResult {
  valid: boolean;
  detectedMime: string | null;
  error?: string;
}

/**
 * Validate file by checking magic bytes.
 * @param bytes - File content as Uint8Array
 * @param maxSizeBytes - Max allowed size (default 10MB)
 */
export function validateFileSignature(
  bytes: Uint8Array,
  maxSizeBytes = 10 * 1024 * 1024
): FileValidationResult {
  // Size check
  if (bytes.length > maxSizeBytes) {
    return {
      valid: false,
      detectedMime: null,
      error: `File too large: ${(bytes.length / 1024 / 1024).toFixed(1)}MB exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  if (bytes.length < 4) {
    return { valid: false, detectedMime: null, error: "File too small to identify" };
  }

  // Check magic bytes
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((b, i) => bytes[i] === b)) {
      return { valid: true, detectedMime: sig.mime };
    }
  }

  return {
    valid: false,
    detectedMime: null,
    error: "Unsupported file type. Allowed: PDF, JPEG, PNG",
  };
}

/**
 * Validate that file is a PDF specifically.
 */
export function validatePdfSignature(bytes: Uint8Array, maxSizeBytes = 10 * 1024 * 1024): FileValidationResult {
  if (bytes.length > maxSizeBytes) {
    return {
      valid: false,
      detectedMime: null,
      error: `File too large: ${(bytes.length / 1024 / 1024).toFixed(1)}MB exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB limit`,
    };
  }

  // PDF magic bytes: %PDF
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { valid: true, detectedMime: "application/pdf" };
  }

  return { valid: false, detectedMime: null, error: "File is not a valid PDF" };
}

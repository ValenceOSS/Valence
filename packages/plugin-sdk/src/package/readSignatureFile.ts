import { z } from 'zod';

const SignatureFileSchema = z.object({
  keyId: z.string().min(1).max(40),
  signature: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
});

/**
 * Reads a signature file as its publisher wrote it: either a small JSON object naming the key and
 * the signature, or the base64 signature on its own.
 *
 * @param text - The file's contents.
 * @returns The signature, and the key it names where it names one.
 */
const readSignatureFile = (text: string): { keyId: string | null; signature: string } | null => {
  const trimmed = text.trim();

  try {
    const read = SignatureFileSchema.safeParse(JSON.parse(trimmed));

    if (read.success) {
      return read.data;
    }
  } catch {
    return /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) ? { keyId: null, signature: trimmed } : null;
  }

  return null;
};

export { readSignatureFile };

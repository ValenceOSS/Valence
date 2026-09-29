import { createDecipheriv } from 'node:crypto';

/**
 * Opens a secret sealed by `sealSecret`. Anything tampered with, sealed under another key or not
 * sealed at all opens to nothing rather than to garbage.
 *
 * @param key - The sealing key.
 * @param sealed - The sealed form.
 * @returns The secret, or nothing where it cannot be opened.
 */
const openSecret = (key: Buffer, sealed: string): string | null => {
  const [version, iv, tag, body] = sealed.split('.');

  if (version !== 'v1' || iv === undefined || tag === undefined || body === undefined) {
    return null;
  }

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));

    decipher.setAuthTag(Buffer.from(tag, 'base64'));

    return Buffer.concat([decipher.update(Buffer.from(body, 'base64')), decipher.final()]).toString(
      'utf8',
    );
  } catch {
    return null;
  }
};

export { openSecret };

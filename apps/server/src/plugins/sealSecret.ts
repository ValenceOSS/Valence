import { createCipheriv, randomBytes } from 'node:crypto';

/**
 * Seals a secret before it is written down — an account's token, a plugin's client secret — so a
 * copy of the database is not a copy of everybody's connected accounts.
 *
 * @param key - The sealing key.
 * @param secret - What to seal.
 * @returns The sealed form, which names its version so the scheme can change.
 */
const sealSecret = (key: Buffer, secret: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const sealed = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);

  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    sealed.toString('base64'),
  ].join('.');
};

export { sealSecret };

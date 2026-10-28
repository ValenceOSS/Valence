import { scrypt } from 'node:crypto';

const COST = 16_384;

/**
 * Derives a scrypt key off the thread answering people. Deriving one is tens of milliseconds of
 * arithmetic on purpose, so that guessing is slow, and done in line it held up every other request
 * the server had for as long; Node's pool does it instead.
 *
 * @param secret - The password or PIN, as typed.
 * @param salt - The salt it is mixed with.
 * @param length - How many bytes to derive.
 * @returns The derived key.
 */
const scryptOf = (secret: string, salt: Buffer, length: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(secret.normalize('NFKC'), salt, length, { N: COST }, (error, derived) => {
      if (error === null) {
        resolve(derived);
      } else {
        reject(error);
      }
    });
  });

export { scryptOf };

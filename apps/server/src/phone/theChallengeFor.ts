import { createHash } from 'node:crypto';

/**
 * The public half of a secret a phone keeps to itself while it signs in through a browser.
 *
 * The phone sends this before the sign-in and the secret itself after, and the two are checked
 * against each other here. Anybody who catches the code on its way back to the phone has the code
 * and not the secret, so the code is no use to them.
 *
 * @param secret - What the phone made up and kept.
 * @returns What it may say out loud.
 */
const theChallengeFor = (secret: string): string =>
  createHash('sha256').update(secret, 'utf8').digest('hex');

export { theChallengeFor };

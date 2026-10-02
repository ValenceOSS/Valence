import { createHash } from 'node:crypto';
import { PASSWORD_RESET_LIFETIME_SECONDS } from '@ValenceServer/auth/PASSWORD_RESET_LIFETIME_SECONDS';
import type { EmailOutcome, EmailService } from './EmailService';

/**
 * Emails a password reset link better-auth has just made, keyed on the link itself so the same
 * link is never sent twice, and saying when it stops working.
 *
 * @param email - The email service.
 * @param reset - Who asked, their name, the link, and the moment it was made.
 * @returns How the send went, or that email is off for password resets.
 */
const emailPasswordReset = (
  email: EmailService,
  { to, name, url, at }: { to: string; name: string; url: string; at: number },
): Promise<EmailOutcome> =>
  email.sendPasswordReset({
    to,
    name,
    url,
    expiresAt: new Date(at + PASSWORD_RESET_LIFETIME_SECONDS * 1000),
    idempotencyKey: `passwordReset:${createHash('sha256').update(url).digest('hex')}`,
  });

export { emailPasswordReset };

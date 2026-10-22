import { AUDIT_KEPT_FOR_DAYS } from './AUDIT_KEPT_FOR_DAYS';
import { SIGN_INS_KEPT_FOR_DAYS } from './SIGN_INS_KEPT_FOR_DAYS';

const DAY_MS = 86_400_000;

/**
 * Says how old an audit entry may get before it is forgotten. Signing in and out happens every
 * day and stops mattering within months; a change an administrator made can be asked about long
 * after, and is rare enough to keep for a year.
 *
 * @param now - The moment the log is being tidied.
 * @returns The moment before which sign-ins, and everything else, are forgotten.
 */
const auditExpiry = (now: Date): { signIns: Date; changes: Date } => ({
  signIns: new Date(now.getTime() - SIGN_INS_KEPT_FOR_DAYS * DAY_MS),
  changes: new Date(now.getTime() - AUDIT_KEPT_FOR_DAYS * DAY_MS),
});

export { auditExpiry };

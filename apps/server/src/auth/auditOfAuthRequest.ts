import type { AuditAction } from '@ValenceContracts/schemas/Audit';
import type { AuditToRecord } from '@ValenceServer/audit/AuditService';
import type { SignInAttempt } from '@ValenceServer/auth/describeSignInAttempt';

const SECURITY_CHANGES: Readonly<Record<string, AuditAction>> = {
  '/change-password': 'auth.passwordChanged',
  '/two-factor/enable': 'auth.twoFactorTurnedOn',
  '/two-factor/disable': 'auth.twoFactorTurnedOff',
  '/passkey/verify-registration': 'auth.passkeyAdded',
  '/passkey/delete-passkey': 'auth.passkeyRemoved',
};

/**
 * Says how somebody signed in, from the address they signed in through.
 *
 * @param path - The sign-in service's path.
 * @returns The way in, as the audit log names it.
 */
const methodOf = (path: string): string => {
  if (path.startsWith('/sign-in')) {
    return 'password';
  }

  if (path.startsWith('/passkey')) {
    return 'passkey';
  }

  if (path.startsWith('/two-factor')) {
    return 'twoFactor';
  }

  if (path.startsWith('/device')) {
    return 'deviceCode';
  }

  return path.startsWith('/one-time-token') ? 'link' : 'other';
};

/**
 * Whether a request to the sign-in service was somebody trying to sign in, whose refusal is worth
 * writing down.
 *
 * @param path - The sign-in service's path.
 * @returns Whether it was.
 */
const isSigningIn = (path: string): boolean =>
  path.startsWith('/sign-in') ||
  path === '/passkey/verify-authentication' ||
  path.startsWith('/two-factor/verify');

/**
 * Turns one finished request to the sign-in service into the audit entry it deserves, or into
 * nothing: somebody signing in, failing to, or changing how they sign in.
 *
 * A failure names what was typed and never why it was refused, the same as the webhook does.
 *
 * @param attempt - The request, as the hook that watched it finish saw it.
 * @returns The entry to record, or nothing.
 */
const auditOfAuthRequest = (attempt: SignInAttempt): AuditToRecord | null => {
  const where = { address: attempt.address, userAgent: attempt.userAgent };

  if (attempt.account !== null) {
    return {
      ...where,
      actorId: attempt.account.id,
      actorName: attempt.account.name,
      action: 'auth.signedIn',
      target: attempt.account.name,
      detail: { method: methodOf(attempt.path) },
    };
  }

  const isRefused = attempt.statusCode !== null && attempt.statusCode >= 400;

  if (isRefused && isSigningIn(attempt.path)) {
    return {
      ...where,
      actorId: null,
      actorName: '',
      action: 'auth.signInFailed',
      target: attempt.identifier,
      detail: { method: methodOf(attempt.path), attempts: '1' },
    };
  }

  const change = SECURITY_CHANGES[attempt.path];

  if (change === undefined || isRefused || attempt.signedInAs === null) {
    return null;
  }

  return {
    ...where,
    actorId: attempt.signedInAs.id,
    actorName: attempt.signedInAs.name,
    action: change,
    target: attempt.signedInAs.name,
  };
};

export { auditOfAuthRequest };

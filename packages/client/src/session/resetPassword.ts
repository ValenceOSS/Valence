import { say } from '@ValenceI18n/say';

/**
 * Sets a new password with the token a reset link carried.
 *
 * @param token - The token from the link.
 * @param newPassword - The new password.
 * @returns Whether it changed, and why not where it did not.
 */
const resetPassword = async (
  token: string,
  newPassword: string,
): Promise<{ kind: 'changed' } | { kind: 'refused'; reason: string }> => {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', reason: say('common.valenceCouldNotBeReached') };
  }

  if (!response.ok) {
    return { kind: 'refused', reason: say('client.session.resetPassword.thatLinkHasExpired') };
  }

  return { kind: 'changed' };
};

export { resetPassword };

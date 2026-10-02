import type { PasswordResetAsk } from '@ValenceContracts/schemas/PasswordResetRequest';

/**
 * Asks for a password reset link for an account, by its username or its address, or by the face
 * somebody picked, leading back to the page that takes a new password. The server answers the same
 * whether or not the account exists.
 *
 * @param ask - The username or address somebody typed, or the face they picked.
 * @param redirectTo - The page the link should open.
 * @returns Whether the server took the request.
 */
const askForPasswordReset = async (ask: PasswordResetAsk, redirectTo: string): Promise<boolean> => {
  const response = await fetch('/api/password-reset', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...ask, redirectTo }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { askForPasswordReset };

/**
 * Asks for a password reset link for an account, by its username or its address, leading back to
 * the page that takes a new password. The server answers the same whether or not the account exists.
 *
 * @param identifier - The username or address somebody typed.
 * @param redirectTo - The page the link should open.
 * @returns Whether the server took the request.
 */
const askForPasswordReset = async (identifier: string, redirectTo: string): Promise<boolean> => {
  const response = await fetch('/api/password-reset', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identifier, redirectTo }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { askForPasswordReset };

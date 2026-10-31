/**
 * Tells the server to stop waking this phone, as it is signed out of.
 *
 * @param token - The phone's push token.
 * @returns Whether the server forgot it.
 */
const forgetThisPhone = async (token: string): Promise<boolean> => {
  const answer = await fetch('/api/notifications/phones', {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token }),
  }).catch(() => null);

  return answer?.ok === true;
};

export { forgetThisPhone };

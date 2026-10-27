/**
 * Tells the server a session made ready ahead has begun playing, so it is counted as a play and the
 * device is shown playing it from now on.
 *
 * @param sessionId - The session made ready ahead.
 * @param clientId - Which device has begun it.
 * @returns Whether the server knew the session.
 */
const beginReadiedSession = async (sessionId: string, clientId?: string): Promise<boolean> => {
  const asked = clientId === undefined ? '' : `?clientId=${encodeURIComponent(clientId)}`;
  const response = await fetch(`/api/playback/session/${sessionId}/begin${asked}`, {
    method: 'POST',
  }).catch(() => null);

  return response?.ok === true;
};

export { beginReadiedSession };

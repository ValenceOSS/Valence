import { writeCurrentProfile } from '@ValenceClient/profiles/currentProfile';

/**
 * Moves this browser to another account already signed in on it. The face chosen for the last one is
 * forgotten, since it belonged to that account.
 *
 * @param token - The session of the account to move to.
 * @returns Whether it moved.
 */
const switchAccount = async (token: string): Promise<boolean> => {
  const response = await fetch('/api/auth/multi-session/set-active', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionToken: token }),
  }).catch(() => null);

  if (response === null || !response.ok) {
    return false;
  }

  writeCurrentProfile(null);

  return true;
};

export { switchAccount };

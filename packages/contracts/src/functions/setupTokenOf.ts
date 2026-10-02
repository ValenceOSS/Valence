const WELCOME = '/welcome/';

/**
 * Reads the token out of a setup link.
 *
 * @param url - The link.
 * @returns Its token, or null when it is not a setup link.
 */
const setupTokenOf = (url: string): string | null => {
  const at = url.lastIndexOf(WELCOME);

  if (at === -1) {
    return null;
  }

  const token = url.slice(at + WELCOME.length).split(/[?#/]/)[0] ?? '';

  return token === '' ? null : token;
};

export { setupTokenOf };

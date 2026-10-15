/**
 * Reads one cookie a request carries, for code that holds the request's headers rather than the
 * request itself.
 *
 * @param headers - The request's headers.
 * @param name - The cookie.
 * @returns Its value, or null where the request carries none by that name.
 */
const cookieOf = (headers: Headers, name: string): string | null => {
  for (const pair of (headers.get('cookie') ?? '').split(';')) {
    const at = pair.indexOf('=');

    if (at > 0 && pair.slice(0, at).trim() === name) {
      return decodeURIComponent(pair.slice(at + 1).trim());
    }
  }

  return null;
};

export { cookieOf };

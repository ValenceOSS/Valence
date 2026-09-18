/**
 * Shortens the address a television tells somebody to open, to the part they have to type.
 *
 * A television is read from across a room, and `https://` and a trailing slash are noise at that
 * distance. Whatever is left is still something a phone's address bar will find.
 *
 * @param verificationUri - The full address the server issued.
 * @returns What to put on the screen.
 */
const whereToTypeTheCode = (verificationUri: string): string =>
  verificationUri.replace(/^https?:\/\//, '').replace(/\/$/, '');

export { whereToTypeTheCode };

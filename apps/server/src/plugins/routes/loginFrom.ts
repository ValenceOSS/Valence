/**
 * Turns a profile's name into a login an app can be given: lower-case letters and digits joined by
 * hyphens.
 *
 * @param name - The profile's name.
 * @returns The login, or nothing where the name has no letters or digits to make one from.
 */
const loginFrom = (name: string): string =>
  name
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, 30);

export { loginFrom };

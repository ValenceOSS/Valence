/**
 * Where the server's own logo is read from, naming the file it currently is so that a new logo is a
 * new address — and so that the old one can be cached for as long as it lives.
 *
 * @param file - The name the logo is kept under.
 * @returns The address.
 */
const brandLogoAddress = (file: string): string => `/api/brand/logo?v=${encodeURIComponent(file)}`;

export { brandLogoAddress };

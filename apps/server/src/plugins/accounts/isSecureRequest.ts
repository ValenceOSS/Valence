/**
 * Whether the request reached Valence over HTTPS, directly or through a proxy that says so.
 *
 * @param url - The address the request was made to.
 * @param forwarded - What a proxy in front said the protocol was.
 * @returns Whether a cookie set in the answer should be kept to HTTPS.
 */
const isSecureRequest = (url: string, forwarded: string | undefined): boolean =>
  new URL(url).protocol === 'https:' || forwarded?.split(',')[0]?.trim() === 'https';

export { isSecureRequest };

/**
 * Whether something typed is a web address a service can be reached at, one starting http or https.
 *
 * @param url - What was typed.
 * @returns Whether it is one.
 */
const isWebAddress = (url: string): boolean =>
  URL.canParse(url) && /^https?:$/.test(new URL(url).protocol);

export { isWebAddress };

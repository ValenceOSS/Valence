import { askTheServer } from '@ValenceClient/session/askTheServer';

/**
 * Swaps the code a browser handed back for a session on this phone.
 *
 * @param code - What came back from the browser.
 * @param secret - What the challenge the browser was sent with was made from.
 * @returns Whether this phone is now signed in.
 */
const swapTheHandBack = async (code: string, secret: string): Promise<boolean> => {
  const response = await askTheServer('/api/phone/exchange', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, secret }),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { swapTheHandBack };

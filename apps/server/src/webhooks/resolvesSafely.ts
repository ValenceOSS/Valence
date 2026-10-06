import { lookup } from 'node:dns/promises';
import { isSafeWebhookUrl } from './isSafeWebhookUrl';

type Resolve = (hostname: string) => Promise<readonly { address: string }[]>;

/**
 * Whether every address a webhook's host resolves to is one Valence will send to. The address as
 * written is checked already, but a name can resolve to the cloud's metadata service as easily as
 * that address can be typed, so the name is looked up and each answer is held to the same check.
 *
 * @param url - Where the delivery is going.
 * @param resolve - How a name is looked up, so a test need not ask the network.
 * @returns Whether it is safe to send there.
 */
const resolvesSafely = async (
  url: string,
  resolve: Resolve = (hostname) => lookup(hostname, { all: true, verbatim: true }),
): Promise<boolean> => {
  const parsed = URL.parse(url);

  if (parsed === null || !isSafeWebhookUrl(url)) {
    return false;
  }

  const answers = await resolve(parsed.hostname.replace(/^\[|\]$/g, '')).catch(() => null);

  return (
    answers !== null &&
    answers.length > 0 &&
    answers.every(({ address }) =>
      isSafeWebhookUrl(`http://${address.includes(':') ? `[${address}]` : address}/`),
    )
  );
};

export { resolvesSafely };

import type { RefusalBody } from '@ValenceI18n/RefusalBody';

/**
 * Why no request can be made just now, where a refusal means the requests service wasn't heard or
 * gave an answer it shouldn't have, rather than that this one was turned down or requesting is off,
 * so a plugin is told by a failure and asks again later instead of letting it go. It never names
 * where the requests service is.
 *
 * @param refusal - The refusal, with the status it was answered with.
 * @returns The failure to tell the plugin, or nothing where it should be answered as refused.
 */
const whyRequestsCannotBeMadeNow = (refusal: { status: number } & RefusalBody): Error | null =>
  refusal.status === 502
    ? new Error('The requests service couldn’t take the request just now. Ask again later.')
    : null;

export { whyRequestsCannotBeMadeNow };

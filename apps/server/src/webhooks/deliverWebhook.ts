import { formatWebhookBody } from './formatWebhookBody';
import { isSafeWebhookUrl } from './isSafeWebhookUrl';
import { resolvesSafely } from './resolvesSafely';
import { signWebhookPayload, WEBHOOK_SIGNATURE_HEADER } from './signWebhookPayload';
import type { WebhookPayload, WebhookPreset } from '@ValenceContracts/schemas/Webhook';
import { say } from '@ValenceI18n/say';

const WEBHOOK_TIMEOUT_MILLISECONDS = 10_000;

type WebhookFetcher = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal: AbortSignal;
  },
) => Promise<{ ok: boolean; status: number }>;

type WebhookTarget = {
  url: string;
  preset: WebhookPreset;
  secret: string;
};

type WebhookDestination = WebhookTarget & { iconUrl: string | null };

type WebhookAttempt = {
  ok: boolean;
  status: number | null;
  error: string | null;
};

/**
 * Sends one event to one subscriber and reports how it went, without throwing — a subscriber being
 * down is an ordinary thing that has to be recorded and retried rather than an error. Refuses
 * outright to send anywhere the address checks reject, whether as written or as its name resolves,
 * follows no redirect — a redirect is an answer that did not arrive, not a new address to send to —
 * and gives up on anything too slow to answer, so that one unresponsive endpoint cannot hold a worker
 * open.
 *
 * @param target Where to send it, what to sign it with, and where Valence's mark can be fetched.
 * @param payload The event being delivered.
 * @param fetchImpl How to make the request, so a test need not open a socket.
 * @param timeoutMilliseconds How long to wait for an answer.
 */
const deliverWebhook = async (
  target: WebhookDestination,
  payload: WebhookPayload,
  fetchImpl?: WebhookFetcher,
  timeoutMilliseconds: number = WEBHOOK_TIMEOUT_MILLISECONDS,
): Promise<WebhookAttempt> => {
  if (!isSafeWebhookUrl(target.url)) {
    return { ok: false, status: null, error: say('error.common.valenceWillNotSendDeliveriesTo') };
  }

  const call: WebhookFetcher =
    fetchImpl ??
    (async (url, init) => {
      if (!(await resolvesSafely(url))) {
        throw new Error(say('error.common.valenceWillNotSendDeliveriesTo'));
      }

      const response = await fetch(url, { ...init, redirect: 'manual' });

      return { ok: response.ok, status: response.status };
    });

  const { body, contentType } = formatWebhookBody(target.preset, payload, target.iconUrl);

  try {
    const response = await call(target.url, {
      method: 'POST',
      headers: {
        'content-type': contentType,
        'user-agent': 'Valence',
        [WEBHOOK_SIGNATURE_HEADER]: signWebhookPayload(target.secret, body),
      },
      body,
      signal: AbortSignal.timeout(timeoutMilliseconds),
    });

    return {
      ok: response.ok,
      status: response.status,
      error: response.ok
        ? null
        : say('server.webhooks.deliverWebhook.theReceiverAnsweredStatus', {
            status: response.status.toString(),
          }),
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error:
        error instanceof Error
          ? error.message
          : say('server.webhooks.deliverWebhook.theDeliveryCouldNotBeMade'),
    };
  }
};

export { deliverWebhook };

export type { WebhookAttempt, WebhookDestination, WebhookFetcher, WebhookTarget };

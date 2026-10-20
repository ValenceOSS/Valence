import type { WebhookEvent, WebhookPayload } from '@ValenceContracts/schemas/Webhook';

const MENTIONED_ON: ReadonlySet<WebhookEvent> = new Set(['requests.available', 'requests.refused']);

/**
 * Who a Discord message should mention: everybody who asked for something, where their account
 * carries their Discord ID, and only once it is ready or refused, which they have not seen happen
 * for themselves. Asking, approval and the steps between are left quiet, since whoever asked
 * already knows they asked.
 *
 * @param payload - What happened.
 * @returns Their Discord IDs, each once, or none.
 */
const discordMentionsOf = (payload: WebhookPayload): string[] => {
  if (!MENTIONED_ON.has(payload.event) || !('request' in payload.data)) {
    return [];
  }

  const { request } = payload.data;

  if (request === null) {
    return [];
  }

  return [
    ...new Set(
      [request.requestedByDiscordId, ...request.askers.map((asker) => asker.discordId)].filter(
        (id): id is string => typeof id === 'string',
      ),
    ),
  ];
};

export { discordMentionsOf };

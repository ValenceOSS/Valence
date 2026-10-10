import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

/**
 * Who a Discord message should mention: the person who asked for something, where their account
 * carries their Discord ID, so they hear whatever happens to it — that it was asked for in their
 * name, approved, refused, or is ready to watch.
 *
 * @param payload - What happened.
 * @returns Their Discord ID, or nothing.
 */
const discordMentionOf = (payload: WebhookPayload): string | null =>
  'request' in payload.data ? (payload.data.request?.requestedByDiscordId ?? null) : null;

export { discordMentionOf };

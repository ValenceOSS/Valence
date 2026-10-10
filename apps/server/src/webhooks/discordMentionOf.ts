import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

/**
 * Who a Discord message should mention: the person who asked for something, where their account
 * carries their Discord ID, so they are told it was asked for in their name.
 *
 * @param payload - What happened.
 * @returns Their Discord ID, or nothing.
 */
const discordMentionOf = (payload: WebhookPayload): string | null =>
  payload.event === 'requests.made' ? (payload.data.request?.requestedByDiscordId ?? null) : null;

export { discordMentionOf };

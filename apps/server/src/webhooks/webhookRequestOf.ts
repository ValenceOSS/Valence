import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { WebhookRequest } from '@ValenceContracts/schemas/Webhook';

/**
 * What a webhook says about a request: what was asked for, by whom first and who else wants it, and
 * where it has got to, with the picture and summary a receiver can show beside it.
 *
 * @param request - The request.
 * @returns It, as webhooks carry it.
 */
const webhookRequestOf = (request: MediaRequest): WebhookRequest => ({
  id: request.id,
  kind: request.kind,
  title: request.title,
  artistName: request.artistName,
  year: request.year,
  overview: request.overview,
  posterUrl: request.posterUrl,
  requestedBy: request.requestedBy.name,
  alsoAskedBy: request.alsoAskedBy.map((asker) => asker.name),
  seasons: request.seasons,
  state: request.state,
});

export { webhookRequestOf };

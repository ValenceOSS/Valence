import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type { WebhookRequest } from '@ValenceContracts/schemas/Webhook';
import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';

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
  requestedByAccountId: request.requestedBy.id,
  requestedByProfile: request.requestedBy.askingProfile?.name ?? null,
  requestedByProfileId: request.requestedBy.askingProfile?.profileId ?? null,
  alsoAskedBy: request.alsoAskedBy.map((asker) =>
    nameOfAsker({ profileName: asker.askingProfile?.name ?? null, household: asker.name }),
  ),
  askers: [request.requestedBy, ...request.alsoAskedBy].map((asker) => ({
    accountId: asker.id,
    profileId: asker.askingProfile?.profileId ?? null,
  })),
  seasons: request.seasons,
  state: request.state,
});

export { webhookRequestOf };

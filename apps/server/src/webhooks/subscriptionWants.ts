import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type { MediaKind } from '@ValenceContracts/schemas/MediaKind';
import type { WebhookEvent, WebhookFilters } from '@ValenceContracts/schemas/Webhook';

type SubscriptionInterest = {
  events: WebhookEvent[];
  filters: WebhookFilters;
};

/**
 * Applies one allowlist to what one event carries.
 *
 * An empty list means everything, which is what a subscription that has chosen nothing gets. An
 * event carrying no values means the filter does not apply to it at all — a failed sign-in names no
 * account, a share link is watched by no profile — and that must pass rather than match nothing.
 * Reading it the other way round is the worst thing this file could do: nothing errors, and every
 * delivery quietly stops. Where it carries several, one of them being asked for is enough.
 *
 * @param allowed - What was asked for, empty meaning everything.
 * @param values - What this event carries, empty where it carries none.
 * @returns Whether the event survives this filter.
 */
const admits = <TValue extends string>(
  allowed: readonly TValue[],
  values: readonly TValue[],
): boolean =>
  allowed.length === 0 || values.length === 0 || values.some((value) => allowed.includes(value));

/**
 * Names everybody who asked for the request an occurrence is about, where it is about one.
 *
 * @param occurrence - What happened.
 * @returns Each asker's account and profile, first asker first, or none.
 */
const askersOf = (occurrence: WebhookOccurrence) =>
  'request' in occurrence.data && occurrence.data.request !== null
    ? occurrence.data.request.askers
    : [];

/**
 * Names the accounts an occurrence is about: everybody who asked, for a request.
 *
 * @param occurrence - What happened.
 * @returns The account ids, or none where this event names no account.
 */
const accountsOf = (occurrence: WebhookOccurrence): string[] => {
  const askers = askersOf(occurrence);

  if (askers.length > 0) {
    return askers.map((asker) => asker.accountId);
  }

  return 'accountId' in occurrence.data && occurrence.data.accountId !== null
    ? [occurrence.data.accountId]
    : [];
};

/**
 * Names the profiles an occurrence is about: every profile that asked, for a request.
 *
 * @param occurrence - What happened.
 * @returns The profile ids, or none where nobody's profile did this.
 */
const profilesOf = (occurrence: WebhookOccurrence): string[] => {
  const askers = askersOf(occurrence);

  if (askers.length > 0) {
    return askers.flatMap((asker) => (asker.profileId === null ? [] : [asker.profileId]));
  }

  return 'profileId' in occurrence.data && occurrence.data.profileId !== null
    ? [occurrence.data.profileId]
    : [];
};

/**
 * Names the kind of thing an occurrence is about, where it is about one.
 *
 * Asked by event rather than by looking for a `kind` field, because a job payload carries one too —
 * `job.completed` reports the kind of job — and reading that as though it named a film would filter
 * job events against a list of media kinds that can never match.
 *
 * @param occurrence - What happened.
 * @returns The kind, or none where this event is about no one item.
 */
const kindsOf = (occurrence: WebhookOccurrence): MediaKind[] => {
  if (occurrence.event === 'media.added' || occurrence.event === 'media.removed') {
    return [occurrence.data.kind];
  }

  if (occurrence.event === 'playback.started' || occurrence.event === 'playback.stopped') {
    return [occurrence.data.item.kind];
  }

  return [];
};

/**
 * Decides whether one subscription wants one thing that happened.
 *
 * Asked at publish, before anything is queued, so that an event nobody wanted costs no queue row, no
 * delivery row and no history entry. Both stores ask this rather than deciding for themselves,
 * because two implementations of the same judgement drift and the drift is invisible — deliveries
 * simply stop, which looks exactly like nothing having happened.
 *
 * A song's playback reaches only a subscription that names songs among the kinds it wants, even
 * though wanting no kind in particular otherwise means wanting every kind: an album played through
 * would post every track to a channel that was set up to hear about films.
 *
 * @param subscription - What this subscriber asked for.
 * @param occurrence - What happened.
 * @returns Whether it should be delivered.
 */
const subscriptionWants = (
  subscription: SubscriptionInterest,
  occurrence: WebhookOccurrence,
): boolean => {
  if (!subscription.events.includes(occurrence.event)) {
    return false;
  }

  if (occurrence.event === 'media.added' && subscription.filters.mediaAdded !== 'perItem') {
    return false;
  }

  if (
    (occurrence.event === 'playback.started' || occurrence.event === 'playback.stopped') &&
    occurrence.data.item.kind === 'song' &&
    !subscription.filters.itemTypes.includes('song')
  ) {
    return false;
  }

  return (
    admits(subscription.filters.accounts, accountsOf(occurrence)) &&
    admits(subscription.filters.profiles, profilesOf(occurrence)) &&
    admits(subscription.filters.itemTypes, kindsOf(occurrence))
  );
};

export type { SubscriptionInterest };

export { subscriptionWants };

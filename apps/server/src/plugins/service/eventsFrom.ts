import { hasWatchedToTheEnd } from '@ValenceContracts/schemas/WatchProgress';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

/**
 * What plugins are told about something that happened on the server, in the plain shape plugins
 * see: what happened, when, to whom and to what. Stopping where Valence counts something as
 * watched — nine tenths of the way, or into its credits — is also told as finishing it, which is
 * what a tracker wants to hear, by the same rule that marks it watched, against how long the library
 * knows it runs where it knows, rather than how much of a stream the player had.
 *
 * @param occurrence - The event as the server published it.
 * @param at - When it happened.
 * @param segments - The marked stretches of what stopped, whose credits count as its end.
 * @returns The events plugins are told of, none where plugins are not told of this one.
 */
const eventsFrom = (
  occurrence: WebhookOccurrence,
  at: string,
  segments: readonly MediaSegment[] = [],
): PluginEvent[] => {
  switch (occurrence.event) {
    case 'playback.started':
      return [
        {
          topic: 'playback.started',
          occurredAt: at,
          accountId: occurrence.data.accountId,
          profileId: occurrence.data.profileId,
          mediaId: occurrence.data.item.itemId,
          positionSeconds: null,
          durationSeconds: occurrence.data.item.durationSeconds,
        },
      ];
    case 'playback.stopped': {
      const { positionSeconds, durationSeconds } = occurrence.data;
      const stopped: PluginEvent = {
        topic: 'playback.stopped',
        occurredAt: at,
        accountId: occurrence.data.accountId,
        profileId: occurrence.data.profileId,
        mediaId: occurrence.data.item.itemId,
        positionSeconds,
        durationSeconds,
      };
      const runs =
        (occurrence.data.item.durationSeconds ?? 0) > 0
          ? occurrence.data.item.durationSeconds
          : durationSeconds;
      const finished =
        positionSeconds !== null &&
        runs !== null &&
        hasWatchedToTheEnd(positionSeconds, runs, segments);

      return finished ? [stopped, { ...stopped, topic: 'playback.finished' }] : [stopped];
    }
    case 'media.added':
    case 'media.removed':
      return [
        {
          topic: occurrence.event,
          occurredAt: at,
          profileId: null,
          mediaId: occurrence.data.itemId,
          positionSeconds: null,
          durationSeconds: null,
        },
      ];
    case 'library.scanned':
      return [
        {
          topic: 'library.scanned',
          occurredAt: at,
          profileId: null,
          mediaId: null,
          positionSeconds: null,
          durationSeconds: null,
        },
      ];
    case 'requests.available':
      return [
        {
          topic: 'requests.available',
          occurredAt: at,
          accountId: occurrence.data.accountId,
          profileId: null,
          mediaId: occurrence.data.mediaId,
          positionSeconds: null,
          durationSeconds: null,
        },
      ];
    case 'webhook.test':
    case 'job.completed':
    case 'job.failed':
    case 'job.stalled':
    case 'job.working':
    case 'catalogue.unreachable':
    case 'catalogue.reachable':
    case 'transcoder.unreachable':
    case 'transcoder.reachable':
    case 'requests.unreachable':
    case 'requests.reachable':
    case 'requests.vpnDown':
    case 'requests.vpnUp':
    case 'requests.indexerFailing':
    case 'requests.indexerWorking':
    case 'requests.downloadStarted':
    case 'requests.downloadFailed':
    case 'requests.made':
    case 'requests.approved':
    case 'requests.refused':
    case 'requests.chosen':
    case 'requests.filed':
    case 'disk.low':
    case 'disk.recovered':
    case 'auth.succeeded':
    case 'auth.failed':
    case 'profile.chosen':
    case 'account.created':
    case 'account.deleted':
    case 'account.roleChanged':
    case 'session.started':
    case 'session.ended':
    case 'plugin.event':
      return [];
  }
};

export { eventsFrom };

import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';

const FINISHED_FROM = 0.9;

/**
 * What plugins are told about something that happened on the server, in the plain shape plugins
 * see: what happened, when, to whom and to what. Stopping near the end of something is also told
 * as finishing it, which is what a tracker wants to hear.
 *
 * @param occurrence - The event as the server published it.
 * @param at - When it happened.
 * @returns The events plugins are told of, none where plugins are not told of this one.
 */
const eventsFrom = (occurrence: WebhookOccurrence, at: string): PluginEvent[] => {
  switch (occurrence.event) {
    case 'playback.started':
      return [
        {
          topic: 'playback.started',
          occurredAt: at,
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
        profileId: occurrence.data.profileId,
        mediaId: occurrence.data.item.itemId,
        positionSeconds,
        durationSeconds,
      };
      const finished =
        positionSeconds !== null &&
        durationSeconds !== null &&
        durationSeconds > 0 &&
        positionSeconds / durationSeconds >= FINISHED_FROM;

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

import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';

type PlaybackMoment = 'playback.paused' | 'playback.resumed' | 'playback.progress';

type Playing = {
  accountId: string | null;
  profileId: string | null;
  mediaId: string;
  positionSeconds: number | null;
  durationSeconds: number | null;
  clientKind: string | null;
  deviceLabel: string;
};

/**
 * What plugins are told as somebody's playing pauses, carries on, or gets further, in the shape
 * they are told everything else, naming the device but never its address.
 *
 * @param topic - Which moment it is.
 * @param at - When it happened, in milliseconds.
 * @param playing - Who is playing what, where it has got to, and on which device.
 * @returns The event.
 */
const playbackEventOf = (topic: PlaybackMoment, at: number, playing: Playing): PluginEvent => ({
  topic,
  occurredAt: new Date(at).toISOString(),
  accountId: playing.accountId,
  profileId: playing.profileId,
  mediaId: playing.mediaId,
  positionSeconds: playing.positionSeconds,
  durationSeconds: playing.durationSeconds,
  client: { kind: playing.clientKind, label: playing.deviceLabel },
});

export type { PlaybackMoment };

export { playbackEventOf };

import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

type ShowcaseSessionOf = {
  id: string;
  who: string;
  title: string;
  episode?: { season: number; number: number; title: string };
  device: string;
  kind: ClientKind;
  isConverting: boolean;
  at: number;
};

const LASTS_SECONDS = 3120;

/**
 * How a made-up session is being sent: the file as it lies, or its picture converted for the device.
 *
 * @param isConverting - Whether the picture is converted.
 * @returns The plan the server would have made.
 */
const planOf = (isConverting: boolean): PlaybackPlan => {
  const asItIs = { code: 'ClientSupportsSource', detail: sayVerbatim('') } as const;

  return {
    mediaId: 'showcase',
    container: { kind: 'passthrough', reason: asItIs },
    video: isConverting
      ? {
          kind: 'transcode',
          codec: 'h264',
          range: 'SDR',
          maxBitrateKbps: 8000,
          maxWidth: 1920,
          maxHeight: 1080,
          reason: { code: 'VideoCodecNotSupported', detail: sayVerbatim('') },
        }
      : { kind: 'passthrough', reason: asItIs },
    audio: { kind: 'passthrough', streamIndex: 1, reason: asItIs },
    subtitles: { kind: 'none', reason: asItIs },
  };
};

/**
 * A made-up session for the landing's admin pictures, shaped as the server reports one.
 *
 * @param of - Who is watching what, on which device, how it is sent and how far through it is.
 * @returns The session.
 */
const aShowcaseSession = (of: ShowcaseSessionOf): ActiveSession => ({
  clientId: of.id,
  accountId: of.who,
  profileId: of.who,
  profileName: of.who,
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: of.device,
  clientKind: of.kind,
  connectedAt: 0,
  streams: null,
  playback: {
    mediaId: of.id,
    mediaTitle: of.episode?.title ?? of.title,
    seriesTitle: of.episode === undefined ? null : of.title,
    seasonNumber: of.episode?.season ?? null,
    episodeNumber: of.episode?.number ?? null,
    hasPoster: false,
    hasBackdrop: false,
    mode: of.isConverting ? 'transcode' : 'direct',
    plan: planOf(of.isConverting),
    reuse: null,
    isPlaying: true,
    pausedByAdmin: false,
    startedAt: 0,
    health: {
      positionSeconds: LASTS_SECONDS * of.at,
      durationSeconds: LASTS_SECONDS,
      bufferedAheadSeconds: 90,
      presentedWidth: 1920,
      presentedHeight: 1080,
    },
  },
  listening: null,
  bookListening: null,
  reading: null,
});

export { aShowcaseSession };

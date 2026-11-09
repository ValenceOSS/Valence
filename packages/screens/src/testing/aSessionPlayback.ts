/* oxlint-disable valence/no-hard-coded-strings -- stands in for a stream in tests */
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';

type SessionPlayback = NonNullable<ActiveSession['playback']>;

const reason = {
  code: 'ClientSupportsSource',
  detail: sayVerbatim('Client declares support'),
} as const;

/**
 * A film a session is watching, for a test: handed over as it is and playing, changed by whatever
 * the test needs.
 *
 * @param changes - What differs from that.
 * @returns What the session is playing.
 */
const aSessionPlayback = (changes: Partial<SessionPlayback> = {}): SessionPlayback => ({
  mediaId: 'media-1',
  mediaTitle: 'Arrival',
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  hasPoster: true,
  hasBackdrop: true,
  mode: 'direct',
  plan: {
    mediaId: 'media-1',
    container: { kind: 'passthrough', reason },
    video: { kind: 'passthrough', reason },
    audio: { kind: 'passthrough', streamIndex: 1, reason },
    subtitles: { kind: 'none', reason },
  },
  reuse: null,
  hardware: null,
  isPlaying: true,
  pausedByAdmin: false,
  startedAt: 1500,
  health: {
    positionSeconds: 4382,
    durationSeconds: 7826,
    bufferedAheadSeconds: 30,
    presentedWidth: 1920,
    presentedHeight: 1080,
  },
  ...changes,
});

export { aSessionPlayback };

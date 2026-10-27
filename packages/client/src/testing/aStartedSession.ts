import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

const ALL_RIGHT = { code: 'ClientSupportsSource' as const, detail: sayVerbatim('It plays here') };

/**
 * A session the server started, to hand to whatever plays it in a test.
 *
 * @param sessionId - Which session.
 * @param overrides - Anything about it that matters to the test.
 * @returns The session.
 */
const aStartedSession = (
  sessionId: string,
  overrides: Partial<StartedSession> = {},
): StartedSession => ({
  sessionId,
  delivery: {
    kind: 'hls',
    manifestUrl: `/api/playback/session/${sessionId}/index.m3u8`,
    dashUrl: null,
  },
  mode: 'Direct stream',
  plan: {
    mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    container: { kind: 'passthrough', reason: ALL_RIGHT },
    video: { kind: 'passthrough', reason: ALL_RIGHT },
    audio: { kind: 'passthrough', streamIndex: 1, reason: ALL_RIGHT },
    subtitles: { kind: 'none', reason: ALL_RIGHT },
  },
  warnings: [],
  reuse: null,
  keptCopies: [],
  playsEpisodesGapless: true,
  ...overrides,
});

export { aStartedSession };

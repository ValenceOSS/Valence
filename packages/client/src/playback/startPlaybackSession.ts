import { sayAgain } from '@ValenceI18n/sayAgain';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { z } from 'zod';
import { PlaybackPlanSchema } from '@ValenceContracts/schemas/PlaybackPlan';
import { TranscodeReuseSchema } from '@ValenceContracts/schemas/TranscodeReuse';
import { KeptCopySchema } from '@ValenceContracts/schemas/KeptCopy';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import type { QualityPreference } from './qualityPreference';
import { say } from '@ValenceI18n/say';
import type { Converted } from '@ValenceContracts/schemas/Converted';
import { PlaybackProblemSchema } from '@ValenceContracts/schemas/PlaybackProblem';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

const DeliverySchema = z.union([
  z.object({
    kind: z.literal('hls'),
    manifestUrl: z.string().min(1),
    dashUrl: z.string().min(1).nullable().default(null),
  }),
  z.object({ kind: z.literal('direct'), url: z.string().min(1) }),
]);

const StartedSessionSchema = z.object({
  sessionId: z.string().min(1),
  delivery: DeliverySchema,
  mode: z.string(),
  plan: PlaybackPlanSchema,
  warnings: z.array(SaidSchema).default([]),
  reuse: TranscodeReuseSchema.nullable().default(null),
  keptCopies: z.array(KeptCopySchema).default([]),
});

type StartedSession = z.infer<typeof StartedSessionSchema>;

type StartOutcome =
  | { kind: 'started'; session: StartedSession }
  | { kind: 'failed'; reason: string; problem: PlaybackProblem };

const ErrorSchema = z.object({ error: z.string(), problem: PlaybackProblemSchema.optional() });

const GONE = 404;

const PROBLEMS_BY_STATUS: Readonly<Record<number, PlaybackProblem>> = {
  401: 'signedOut',
  403: 'signedOut',
  404: 'missing',
  422: 'unconvertible',
  429: 'tooManyStreams',
  502: 'unreachable',
  503: 'unreachable',
  504: 'unreachable',
};

/**
 * Asks the server for a session: what to play, from where, and on what this client can actually
 * take. Answers with the failure rather than throwing, since a refusal is something the player has
 * to explain rather than something that should break it.
 *
 * @param mediaId - What to play.
 * @param deviceProfile - What this client can decode.
 * @param clientId - Which device is asking, for presence.
 * @param startSeconds - Where to begin.
 * @param audioStreamIndex - A particular audio track, where one was chosen.
 * @param requestedQuality - A ceiling a viewer chose; the original asks for none, and auto asks
 *   for every quality kept beside the film, for the player to switch between.
 * @param subtitleStreamIndex - A subtitle stream to draw into the picture, where one was chosen.
 * @param converted - What to have converted rather than copied, after a copy of it failed to play.
 * @returns The session, or why there is not one.
 */
const startPlaybackSession = async (
  mediaId: string,
  deviceProfile: DeviceProfile,
  clientId: string,
  startSeconds = 0,
  audioStreamIndex?: number,
  requestedQuality?: QualityPreference,
  subtitleStreamIndex?: number,
  converted?: Converted,
): Promise<StartOutcome> => {
  const response = await fetch(`/api/playback/${mediaId}/session`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      deviceProfile,
      clientId,
      startSeconds,
      ...(audioStreamIndex === undefined ? {} : { audioStreamIndex }),
      ...(requestedQuality === undefined ||
      requestedQuality === 'original' ||
      requestedQuality === 'auto'
        ? {}
        : { requestedQuality }),
      ...(subtitleStreamIndex === undefined ? {} : { subtitleStreamIndex }),
      ...(requestedQuality === 'auto' ? { isAdaptive: true } : {}),
      ...(converted === undefined ? {} : { converted }),
    }),
  }).catch(() => null);

  if (response === null) {
    return {
      kind: 'failed',
      reason: say('common.theServerCouldNotBeReached'),
      problem: 'unreachable',
    };
  }

  if (!response.ok) {
    const body = ErrorSchema.safeParse(await response.json().catch(() => null));

    return {
      kind: 'failed',
      reason: body.success
        ? body.data.error
        : say('client.playback.startPlaybackSession.valenceAskedForSomethingTheServer', {
            status: response.status.toString(),
          }),
      problem:
        (body.success ? body.data.problem : undefined) ??
        PROBLEMS_BY_STATUS[response.status] ??
        'unknown',
    };
  }

  const parsed = StartedSessionSchema.safeParse(await response.json());

  if (!parsed.success) {
    return {
      kind: 'failed',
      reason: say('client.playback.startPlaybackSession.theServerSentAResponseValence'),
      problem: 'unknown',
    };
  }

  return { kind: 'started', session: parsed.data };
};

/**
 * Tells the server a session is finished, so the encoder stops rather than running on for a viewer
 * who has gone.
 *
 * Names the device letting go, because everyone watching the same thing at the same quality holds
 * one session: without it the server knows a viewer left but not which, and goes on telling the
 * next arrival they are sharing with somebody who has gone.
 *
 * @param sessionId - The session to stop.
 * @param clientId - Which device is letting go of it.
 * @param keepalive - Whether the page is going away, which decides whether the browser has promised
 *   to finish the request.
 */
const stopPlaybackSession = async (
  sessionId: string,
  clientId?: string,
  keepalive = false,
): Promise<void> => {
  const asked = clientId === undefined ? '' : `?clientId=${encodeURIComponent(clientId)}`;

  await fetch(`/api/playback/session/${sessionId}${asked}`, {
    method: 'DELETE',
    keepalive,
  }).catch(() => undefined);
};

/**
 * Tells presence a tab has genuinely stopped watching, rather than merely paused, so an operator's
 * session list empties when a viewer leaves.
 *
 * @param clientId - Which device.
 * @param keepalive - Whether the page is going away, which decides whether the request is one the
 *   browser has promised to finish.
 */
const stopWatching = async (clientId: string, keepalive = false): Promise<void> => {
  await fetch(`/api/presence/${clientId}/watching`, {
    method: 'DELETE',
    keepalive,
  }).catch(() => undefined);
};

/**
 * Tells the server a session is still wanted, so the idle reaper does not collect it, and whether it
 * is currently playing, and says what came back: the session alive, the session gone, which is what
 * a server that restarted and could not take it back up says, or no answer at all.
 *
 * @param sessionId - The session.
 * @param isPlaying - Whether the picture is moving.
 * @param clientId - Which device is saying so, so the server can tell it is this viewer's own.
 * @returns Whether the session is alive, gone, or the server did not answer.
 */
const heartbeatPlaybackSession = async (
  sessionId: string,
  isPlaying: boolean,
  clientId?: string,
): Promise<'alive' | 'gone' | 'unanswered'> => {
  const asked = clientId === undefined ? '' : `?clientId=${encodeURIComponent(clientId)}`;
  const answer = await fetch(`/api/playback/session/${sessionId}/heartbeat${asked}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ isPlaying }),
  }).catch(() => null);

  return answer === null
    ? 'unanswered'
    : answer.status === GONE
      ? 'gone'
      : answer.ok
        ? 'alive'
        : 'unanswered';
};

/**
 * Tells presence whether this tab is playing right now, along with what it can measure of the
 * stream — which is what fills the position and the health an operator watches on the sessions page.
 *
 * @param clientId - Which device.
 * @param isPlaying - Whether the picture is moving.
 * @param health - What the browser reports about the stream, where it reports anything.
 */
const sendPresenceHeartbeat = async (
  clientId: string,
  isPlaying: boolean,
  health?: {
    positionSeconds: number;
    durationSeconds: number;
    bufferedAheadSeconds: number;
    presentedWidth: number;
    presentedHeight: number;
  },
): Promise<void> => {
  await fetch(`/api/presence/${clientId}/heartbeat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ isPlaying, ...(health === undefined ? {} : { health }) }),
  }).catch(() => undefined);
};

/**
 * Summarises a negotiated plan as one sentence a viewer can act on — what is being changed and why —
 * rather than as the four axes an operator would read.
 *
 * @param plan - The plan the server answered with.
 * @returns The sentence to show.
 */
const describeWhy = (plan: PlaybackPlan): string[] => {
  const reasons: string[] = [];

  if (plan.video.kind === 'transcode') {
    reasons.push(
      say('client.playback.startPlaybackSession.videoDetail', {
        detail: sayAgain(plan.video.reason.detail),
      }),
    );
  }

  if (plan.audio.kind === 'transcode') {
    reasons.push(
      say('client.playback.startPlaybackSession.audioDetail', {
        detail: sayAgain(plan.audio.reason.detail),
      }),
    );
  }

  if (plan.container.kind === 'remux') {
    reasons.push(
      say('client.playback.startPlaybackSession.containerDetail', {
        detail: sayAgain(plan.container.reason.detail),
      }),
    );
  }

  if (plan.subtitles.kind === 'burnIn') {
    reasons.push(
      say('client.playback.startPlaybackSession.subtitlesDetail', {
        detail: sayAgain(plan.subtitles.reason.detail),
      }),
    );
  }

  return reasons.length > 0
    ? reasons
    : [say('client.playback.startPlaybackSession.playingWithoutAnyConversion')];
};

export type { StartedSession, StartOutcome };

export {
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  describeWhy,
};

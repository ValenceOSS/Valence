import { PLAYBACK_PROBLEMS } from '@ValenceContracts/schemas/PlaybackProblem';
import type {
  PlaybackProblem,
  PlaybackProblemGroup,
} from '@ValenceContracts/schemas/PlaybackProblem';
import { say } from '@ValenceI18n/say';

type DescribedProblem = {
  code: number;
  group: PlaybackProblemGroup;
  heading: string;
  line: string;
  action: 'retry' | 'signIn' | null;
};

const WORDS: Readonly<Record<PlaybackProblem, () => { heading: string; line: string }>> = {
  damaged: () => ({
    heading: say('client.playback.playbackProblems.damagedHeading'),
    line: say('client.playback.playbackProblems.damagedLine'),
  }),
  missing: () => ({
    heading: say('client.playback.playbackProblems.missingHeading'),
    line: say('client.playback.playbackProblems.missingLine'),
  }),
  unreadable: () => ({
    heading: say('client.playback.playbackProblems.unreadableHeading'),
    line: say('client.playback.playbackProblems.unreadableLine'),
  }),
  unsupported: () => ({
    heading: say('client.playback.playbackProblems.unsupportedHeading'),
    line: say('client.playback.playbackProblems.unsupportedLine'),
  }),
  unconvertible: () => ({
    heading: say('client.playback.playbackProblems.unconvertibleHeading'),
    line: say('client.playback.playbackProblems.unconvertibleLine'),
  }),
  unreachable: () => ({
    heading: say('client.playback.playbackProblems.unreachableHeading'),
    line: say('client.playback.playbackProblems.unreachableLine'),
  }),
  stopped: () => ({
    heading: say('client.playback.playbackProblems.stoppedHeading'),
    line: say('client.playback.playbackProblems.stoppedLine'),
  }),
  converterDown: () => ({
    heading: say('client.playback.playbackProblems.converterDownHeading'),
    line: say('client.playback.playbackProblems.tellYourAdmin'),
  }),
  streamLost: () => ({
    heading: say('client.playback.playbackProblems.streamLostHeading'),
    line: say('client.playback.playbackProblems.streamLostLine'),
  }),
  tooManyStreams: () => ({
    heading: say('client.playback.playbackProblems.tooManyStreamsHeading'),
    line: say('client.playback.playbackProblems.tooManyStreamsLine'),
  }),
  signedOut: () => ({
    heading: say('client.playback.playbackProblems.signedOutHeading'),
    line: say('client.playback.playbackProblems.signedOutLine'),
  }),
  playerBroke: () => ({
    heading: say('client.playback.playbackProblems.playerBrokeHeading'),
    line: say('client.playback.playbackProblems.playerBrokeLine'),
  }),
  unknown: () => ({
    heading: say('client.playback.playbackProblems.unknownHeading'),
    line: say('client.playback.playbackProblems.tellYourAdmin'),
  }),
  downloadMissing: () => ({
    heading: say('client.playback.playbackProblems.downloadMissingHeading'),
    line: say('client.playback.playbackProblems.downloadMissingLine'),
  }),
};

/**
 * What a player says about something that stopped it: a heading saying briefly what is wrong, a
 * line saying what to do about it, its code, the group that picks its icon, and the one thing that
 * may help where something can, trying again for what passes and signing in for a lapsed sign-in.
 *
 * A stream an admin stopped says the reason they gave, where they gave one.
 *
 * @param problem - What stopped playing.
 * @param reason - Why an admin stopped the stream, where that is what happened and they said.
 * @returns What to show.
 */
const describePlaybackProblem = (
  problem: PlaybackProblem,
  reason: string | null = null,
): DescribedProblem => {
  const { code, group, isPassing } = PLAYBACK_PROBLEMS[problem];
  const words = WORDS[problem]();

  return {
    code,
    group,
    heading: words.heading,
    line: problem === 'stopped' && reason !== null && reason !== '' ? reason : words.line,
    action: isPassing ? 'retry' : problem === 'signedOut' ? 'signIn' : null,
  };
};

export type { DescribedProblem };

export { describePlaybackProblem };

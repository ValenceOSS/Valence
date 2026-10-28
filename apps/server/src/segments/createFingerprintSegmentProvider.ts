import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { agreeRange } from '@ValenceCore/functions/findSharedAudio';
import { printsInOrder } from './printsInOrder';
import { INTRO_BOUNDS } from './SegmentProvider';
import type { SegmentCandidate, SegmentProvider } from './SegmentProvider';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';
import type { AudioMatcher } from './AudioMatcher';
import { saying } from '@ValenceI18n/saying';

const LONGEST_WINDOW_SECONDS = 600;

const SHORTEST_WINDOW_SECONDS = 180;

const WINDOW_FRACTION = 0.35;

const REFERENCES = 3;

const MOST_HELD_AGAINST = 10;

const MIN_EPISODES = 3;

const AT_ONCE = 4;

type Listened = {
  mediaId: string;
  hashes: number[];
  framesPerSecond: number;
};

type CreateFingerprintSegmentProviderOptions = {
  transcoder: Transcoder;
  matcher: AudioMatcher;
  atOnce?: number;
  onProblem?: (path: string, reason: Said) => void;
};

/**
 * How much of an episode to listen to.
 *
 * An intro sits near the beginning, so listening to a whole file would be decoding forty minutes to
 * find ninety seconds. Ten minutes is enough for a drama that opens cold and then titles, and a
 * third of a short comedy is less than that — decoding ten minutes of a twenty-two minute episode
 * is half the episode to find something in its first three.
 *
 * @param durationSeconds - How long the episode runs.
 * @returns How many seconds of it to fingerprint.
 */
const windowFor = (durationSeconds: number): number => {
  const whole = Math.max(Math.floor(durationSeconds), 0);
  const wanted = Math.max(Math.floor(whole * WINDOW_FRACTION), SHORTEST_WINDOW_SECONDS);

  return Math.min(wanted, LONGEST_WINDOW_SECONDS, whole);
};

/**
 * Chooses the episodes every other one is measured against.
 *
 * Episodes that have already been through this are preferred, and that is the whole reason a season
 * which gains one episode a week does not cost what the first run cost: the new episode is
 * fingerprinted, three settled ones are fingerprinted to hold it against, and the rest of the
 * season is left alone. A season nothing has been done to yet has no settled episodes to draw on
 * and simply takes its first few.
 *
 * Which of these can actually be listened to is settled afterwards, since a file that turns out to
 * have no audio is found by trying it.
 *
 * @param group - Every episode of the season.
 * @returns The episodes to measure the others against.
 */
const referencesIn = (group: SegmentCandidate[]): SegmentCandidate[] => {
  const settled = group.filter((one) => one.isComplete);

  return (settled.length >= REFERENCES ? settled : group).slice(0, REFERENCES);
};

/**
 * Finds intros by fingerprinting the audio of several episodes of the same season and looking for
 * the stretch they share. Slower than reading chapters and available for every file, which is why
 * it is what runs when a file carries no chapters.
 *
 * Every episode without an intro is fingerprinted and measured against a few references, rather
 * than every episode being measured against every other. Comparing all of them against all of them
 * is work squared for an answer that three agreeing opinions already give, and it is why this used
 * to stop after the first eight episodes of a season — which left the ninth onwards with no intro
 * at all while marking the whole season done. An episode the references disagree with, as where
 * the first episodes of a season open differently, is held against a few more before going without.
 *
 * @param options - The transcoder that fingerprints audio, the matcher that holds the fingerprints
 *   against each other off the thread answering people, and how many files to listen to at once.
 * @returns The segment provider.
 */
const createFingerprintSegmentProvider = ({
  transcoder,
  matcher,
  atOnce = AT_ONCE,
  onProblem,
}: CreateFingerprintSegmentProviderOptions): SegmentProvider => ({
  name: 'fingerprint',

  detect: async (group: SegmentCandidate[], onItemDone?: () => void, correlationId?: string) => {
    const found = new Map<string, MediaSegment[]>();

    if (group.length < MIN_EPISODES) {
      return found;
    }

    if (!(await transcoder.isReachable())) {
      throw new Error('The media service is not answering, so nothing can be listened to.');
    }

    const references = referencesIn(group);
    const outstanding = group.filter((one) => !one.isComplete);

    const wanted = [
      ...new Map([...references, ...outstanding].map((one) => [one.mediaId, one])).values(),
    ];

    const listened = await mapWithLimit(wanted, atOnce, async (item) => {
      try {
        const printed = await transcoder.fingerprint({
          inputPath: item.path,
          startSeconds: 0,
          durationSeconds: windowFor(item.durationSeconds),
          ...(correlationId === undefined ? {} : { correlationId }),
        });

        return {
          mediaId: item.mediaId,
          hashes: printed.hashes,
          framesPerSecond: printed.framesPerSecond,
        };
      } catch (error) {
        onProblem?.(
          item.path,
          error instanceof Error
            ? sayVerbatim(error.message)
            : saying('server.segments.fingerprintSegmentProvider.couldNotBeListenedTo'),
        );

        return null;
      } finally {
        onItemDone?.();
      }
    });

    const prints = new Map(
      listened.filter((one): one is Listened => one !== null).map((one) => [one.mediaId, one]),
    );

    if (prints.size < MIN_EPISODES) {
      return found;
    }

    const matched = await matcher.matchSeason({
      prints: printsInOrder(prints, [...references, ...wanted]),
      wanted: outstanding.map((one) => one.mediaId),
      minSeconds: INTRO_BOUNDS.minSeconds,
      enough: REFERENCES,
      most: MOST_HELD_AGAINST,
    });

    for (const item of outstanding) {
      const ranges = matched.get(item.mediaId) ?? [];

      if (ranges.length < 2) {
        continue;
      }

      const agreed = agreeRange(ranges);

      if (agreed === null) {
        continue;
      }

      found.set(item.mediaId, [
        {
          kind: 'intro',
          startSeconds: agreed.startSeconds,
          endSeconds: agreed.endSeconds,
          source: 'fingerprint',
        },
      ]);
    }

    return found;
  },
});

export { createFingerprintSegmentProvider, windowFor, referencesIn };

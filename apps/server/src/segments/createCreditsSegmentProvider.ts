import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { mapWithLimit } from '@ValenceCore/functions/mapWithLimit';
import { findSharedAudio, agreeRange } from '@ValenceCore/functions/findSharedAudio';
import { blackEnough, findCreditsInFrames, findTheCut } from './findCreditsInFrames';
import { creditsFromChapters } from './creditsFromChapters';
import { referencesIn } from './createFingerprintSegmentProvider';
import { CREDITS_BOUNDS } from './SegmentProvider';
import type { SegmentCandidate, SegmentProvider } from './SegmentProvider';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { Range } from '@ValenceCore/functions/findSharedAudio';
import type { Transcoder } from '@ValenceServer/transcoder/TranscoderClient';

type Stretch = { startSeconds: number; endSeconds: number; isChapter: boolean };

const PICTURE_WINDOW_SECONDS = 900;

const AUDIO_WINDOW_SECONDS = 450;

const LONGEST_WINDOW_SHARE = 0.4;

const LONGEST_CUT_SEARCH_SECONDS = 30;

const MERGED_WITHIN_SECONDS = 20;

const REFERENCES = 3;

const MIN_EPISODES = 3;

const AT_ONCE = 4;

type CreateCreditsSegmentProviderOptions = {
  transcoder: Transcoder;
  atOnce?: number;
  onProblem?: (path: string, reason: Said) => void;
};

/**
 * Says how much of the end of something to look through for its credits: as much as long credits
 * run, but never so much of a short film that the middle of it is searched.
 *
 * @param durationSeconds - How long it runs.
 * @param most - The most to look through.
 * @returns Where to start looking, and for how long.
 */
const endWindowFor = (
  durationSeconds: number,
  most: number,
): { startSeconds: number; durationSeconds: number } => {
  const length = Math.min(most, Math.max(durationSeconds, 0) * LONGEST_WINDOW_SHARE);

  return {
    startSeconds: Math.max(Math.floor(durationSeconds - length), 0),
    durationSeconds: Math.ceil(length),
  };
};

/**
 * Puts what each way of looking found together, as Intro Skipper does: stretches overlapping or a
 * moment apart are one, taking the earliest start and latest end, and the one ending last is the
 * credits, so a scene after an earlier roll still plays. A chapter's end is never crossed, and an end
 * within a few seconds of the film's is taken to it.
 *
 * @param stretches - What was found.
 * @param durationSeconds - How long the film runs.
 * @returns The credits, or null where nothing was found long enough to be them.
 */
const combineCredits = (
  stretches: readonly Stretch[],
  durationSeconds: number,
): { startSeconds: number; endSeconds: number } | null => {
  const ordered = stretches.toSorted((a, b) => a.startSeconds - b.startSeconds);
  const groups: Stretch[][] = [];

  for (const stretch of ordered) {
    const group = groups.at(-1);
    const reaches = group === undefined ? null : Math.max(...group.map((one) => one.endSeconds));

    if (
      group !== undefined &&
      reaches !== null &&
      stretch.startSeconds - reaches <= MERGED_WITHIN_SECONDS
    ) {
      group.push(stretch);
    } else {
      groups.push([stretch]);
    }
  }

  const last = groups.at(-1);

  if (last === undefined) {
    return null;
  }

  const chapterEnd = last.find((one) => one.isChapter)?.endSeconds ?? Infinity;
  const startSeconds = Math.min(...last.map((one) => one.startSeconds));
  const reaches = Math.min(Math.max(...last.map((one) => one.endSeconds)), chapterEnd);
  const endSeconds =
    durationSeconds - reaches <= CREDITS_BOUNDS.toTheEndWithinSeconds ? durationSeconds : reaches;

  return endSeconds - startSeconds < CREDITS_BOUNDS.minSeconds
    ? null
    : { startSeconds, endSeconds };
};

type Listening = {
  transcoder: Transcoder;
  atOnce: number;
  correlationId?: string;
  onProblem?: (path: string, reason: Said) => void;
};

/**
 * Listens to the endings of the episodes still without credits, and of a few others of the season to
 * hold them against, for a stretch they share, as the same music under the credits each week is.
 *
 * @param listening - The transcoder that fingerprints audio, and how many files to read at once.
 * @param season - Every episode of the season.
 * @param wanted - The episodes still without credits.
 * @returns Where each episode's shared ending runs, in its own time.
 */
const listenForSharedEndings = async (
  { transcoder, atOnce, correlationId, onProblem }: Listening,
  season: readonly SegmentCandidate[],
  wanted: readonly SegmentCandidate[],
): Promise<Map<string, Range>> => {
  const references = referencesIn([...season]).slice(0, REFERENCES);
  const everyone = [
    ...new Map([...references, ...wanted].map((one) => [one.mediaId, one])).values(),
  ];
  const printed = await mapWithLimit(everyone, atOnce, async (item) => {
    const window = endWindowFor(item.durationSeconds, AUDIO_WINDOW_SECONDS);

    try {
      const print = await transcoder.fingerprint({
        inputPath: item.path,
        startSeconds: window.startSeconds,
        durationSeconds: window.durationSeconds,
        ...(correlationId === undefined ? {} : { correlationId }),
      });

      return { mediaId: item.mediaId, offset: window.startSeconds, ...print };
    } catch (error) {
      onProblem?.(
        item.path,
        error instanceof Error
          ? sayVerbatim(error.message)
          : saying('server.segments.creditsSegmentProvider.couldNotBeRead'),
      );

      return null;
    }
  });
  const prints = printed.flatMap((one) => (one === null ? [] : [one]));
  const shared = new Map<string, Range>();

  for (const item of wanted) {
    const mine = prints.find((one) => one.mediaId === item.mediaId);

    if (mine === undefined) {
      continue;
    }

    const ranges = prints
      .filter((other) => other.mediaId !== item.mediaId)
      .flatMap((other) => {
        const match = findSharedAudio(mine.hashes, other.hashes, {
          framesPerSecond: mine.framesPerSecond,
          minSeconds: CREDITS_BOUNDS.minSeconds,
        });

        return match === null ? [] : [match.left];
      });
    const agreed = ranges.length < 2 ? null : agreeRange(ranges);

    if (agreed !== null) {
      shared.set(item.mediaId, {
        startSeconds: mine.offset + agreed.startSeconds,
        endSeconds: mine.offset + agreed.endSeconds,
      });
    }
  }

  return shared;
};

/**
 * Finds end credits, cheapest way first, as Intro Skipper does. The last minutes' keyframes are read
 * for lettering on black and the cut found to the frame, and a chapter named for the credits bounds
 * what they find — a chapter's mark often waits for the next keyframe, so a cut a moment before it
 * moves the start earlier, but nothing crosses its end. Episodes neither placed are listened to,
 * their endings held against others of the season for a stretch they share, which finds credits
 * over pictures set to the same music each week. A film has nothing to be held against. Where no
 * file of the group could be read at all, it says so rather than answering, so the group is tried
 * again another time instead of being marked as looked at.
 *
 * @param options - The transcoder that reads frames and audio, and how many files to read at once.
 * @returns The segment provider.
 */
const createCreditsSegmentProvider = ({
  transcoder,
  atOnce = AT_ONCE,
  onProblem,
}: CreateCreditsSegmentProviderOptions): SegmentProvider => ({
  name: 'credits',

  detect: async (group: SegmentCandidate[], onItemDone?: () => void, correlationId?: string) => {
    const found = new Map<string, MediaSegment[]>();
    const outstanding = group.filter((one) => !one.isCreditsComplete && one.durationSeconds > 0);
    const problems: Error[] = [];
    let unreadable = 0;
    const asked = correlationId === undefined ? {} : { correlationId };
    const readFrames = transcoder.creditFrames;

    if (outstanding.length === 0) {
      return found;
    }

    if (!(await transcoder.isReachable())) {
      throw new Error('The media service is not answering, so nothing can be read.');
    }

    const looked = await mapWithLimit(outstanding, atOnce, async (item) => {
      const chapters = creditsFromChapters(item.probe.chapters, item.durationSeconds);

      if (readFrames === undefined) {
        return { item, chapters, picture: null };
      }

      try {
        const window = endWindowFor(item.durationSeconds, PICTURE_WINDOW_SECONDS);
        const looks = await readFrames({
          inputPath: item.path,
          startSeconds: window.startSeconds,
          ...asked,
        });
        const minimum = blackEnough(looks);
        const credits = findCreditsInFrames(looks, item.durationSeconds, minimum);

        if (credits === null || credits.storyBefore === null) {
          return { item, chapters, picture: credits };
        }

        const searchFrom = Math.max(
          credits.storyBefore,
          credits.blackAt - LONGEST_CUT_SEARCH_SECONDS,
        );
        const between = await readFrames({
          inputPath: item.path,
          startSeconds: searchFrom,
          durationSeconds: credits.blackAt - searchFrom + 0.1,
          everyFrame: true,
          ...asked,
        });
        const cut = findTheCut(between, minimum);

        return {
          item,
          chapters,
          picture: cut === null ? credits : { ...credits, startSeconds: cut },
        };
      } catch (error) {
        unreadable += 1;
        problems.push(error instanceof Error ? error : new Error(String(error)));
        onProblem?.(
          item.path,
          error instanceof Error
            ? sayVerbatim(error.message)
            : saying('server.segments.creditsSegmentProvider.couldNotBeRead'),
        );

        return { item, chapters, picture: null };
      }
    });

    if (unreadable === outstanding.length) {
      throw problems[0] ?? new Error('None of these files could be read.');
    }

    const unplaced = looked
      .filter((one) => one.chapters?.isSettled !== true && one.picture === null)
      .map((one) => one.item);
    const heard =
      group.length >= MIN_EPISODES && unplaced.length > 0
        ? await listenForSharedEndings(
            { transcoder, atOnce, ...asked, ...(onProblem === undefined ? {} : { onProblem }) },
            group,
            unplaced,
          )
        : new Map<string, Range>();

    for (const { item, chapters, picture } of looked) {
      const shared = heard.get(item.mediaId);
      const stretches: Stretch[] = [
        ...(chapters === null ? [] : [{ ...chapters, isChapter: true }]),
        ...(picture === null
          ? []
          : [
              {
                startSeconds: picture.startSeconds,
                endSeconds: picture.endSeconds,
                isChapter: false,
              },
            ]),
        ...(shared === undefined ? [] : [{ ...shared, isChapter: false }]),
      ];
      const credits = combineCredits(stretches, item.durationSeconds);

      if (credits !== null) {
        found.set(item.mediaId, [{ kind: 'credits', ...credits, source: 'fingerprint' }]);
      }

      onItemDone?.();
    }

    return found;
  },
});

export { createCreditsSegmentProvider, combineCredits, endWindowFor };

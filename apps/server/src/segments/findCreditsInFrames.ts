import { CREDITS_BOUNDS } from './SegmentProvider';

type KeyframeLook = {
  seconds: number;
  blackPercent: number;
  yMin: number;
  yLow: number;
  yHigh: number;
  yMax: number;
  saturation: number;
};

type FoundCredits = {
  startSeconds: number;
  endSeconds: number;
  blackAt: number;
  storyBefore: number | null;
};

const BLACK_PERCENT = 85;

const MOST_FLOOR_PERCENT = 30;

const FLOOR_PERCENTILE = 0.01;

const LONGEST_BLACK_GAP_SECONDS = 60;

const LONGEST_INTERRUPTION_SECONDS = 20;

const LETTERING_SPREAD = 60;

const ROLL_PAGE_DARKEST = 18;

const ROLL_PAGE_MOST_COLOUR = 4;

const ROLL_PAGE_LEAST_BLACK = 50;

/**
 * Works out how much of a frame has to be black to count as black, raised over a film that is never
 * fully black anywhere — letterboxing or a lifted black level puts a floor under every frame, and
 * the same share of black means less above it.
 *
 * @param looks - Every keyframe read.
 * @returns The share of black pixels, from 0 to 100, a frame needs.
 */
const blackEnough = (looks: readonly KeyframeLook[]): number => {
  const shares = looks.map((look) => look.blackPercent).toSorted((a, b) => a - b);
  const floor = Math.min(
    shares[Math.floor(shares.length * FLOOR_PERCENTILE)] ?? 0,
    MOST_FLOOR_PERCENT,
  );

  return (BLACK_PERCENT * (100 - floor)) / 100 + floor;
};

/**
 * Decides whether a keyframe is a page of credits too full of names to clear the bar for black: its
 * darkest tenth true black, all but colourless, with lettering on it.
 *
 * @param look - The keyframe.
 * @returns Whether it reads as a page of a roll.
 */
const isARollPage = (look: KeyframeLook): boolean =>
  look.yLow <= ROLL_PAGE_DARKEST &&
  look.saturation < ROLL_PAGE_MOST_COLOUR &&
  look.yMax - look.yLow >= LETTERING_SPREAD &&
  look.blackPercent >= ROLL_PAGE_LEAST_BLACK;

/**
 * Finds where a film's end credits roll from how its last keyframes look: the latest run of black
 * keyframes carrying lettering, long enough to be credits rather than a fade between scenes, as
 * Intro Skipper looks for them. A run breaks at a keyframe of picture, not at a long wait between
 * keyframes, since an encoder sets few in a still roll of credits; pieces of a roll a moment of
 * picture apart are one roll. A run that stops within a few seconds of the end is taken to the
 * end. Credits over pictures are not found this way, and a text epilogue on black is found as
 * credits, since nothing in the frames tells the two apart.
 *
 * @param looks - The keyframes from some way before the end, in order.
 * @param durationSeconds - How long the film runs.
 * @param minimum - The share of black a frame needs, where it was worked out already.
 * @returns Where the credits run, the first black keyframe, and the last keyframe of story before
 *   it, between which the exact cut lies; or null where nothing looks like credits.
 */
const findCreditsInFrames = (
  looks: readonly KeyframeLook[],
  durationSeconds: number,
  minimum = blackEnough(looks),
): FoundCredits | null => {
  const ordered = looks.toSorted((a, b) => a.seconds - b.seconds);
  const isBlack = (look: KeyframeLook) => look.blackPercent >= minimum || isARollPage(look);
  const runs: KeyframeLook[][] = [];
  let isInARun = false;

  for (const look of ordered) {
    const run = runs.at(-1);
    const last = run?.at(-1);

    if (!isBlack(look)) {
      isInARun = false;

      continue;
    }

    if (
      isInARun &&
      run !== undefined &&
      last !== undefined &&
      look.seconds - last.seconds <= LONGEST_BLACK_GAP_SECONDS
    ) {
      run.push(look);
    } else {
      runs.push([look]);
      isInARun = true;
    }
  }

  const joined = runs.reduce<KeyframeLook[][]>((kept, run) => {
    const previous = kept.at(-1);
    const previousEnd = previous?.at(-1);
    const first = run[0];

    if (
      previous !== undefined &&
      previousEnd !== undefined &&
      first !== undefined &&
      first.seconds - previousEnd.seconds <= LONGEST_INTERRUPTION_SECONDS
    ) {
      previous.push(...run);

      return kept;
    }

    return [...kept, [...run]];
  }, []);

  const credible = joined.flatMap((run) => {
    const first = run[0];
    const last = run.at(-1);

    if (first === undefined || last === undefined) {
      return [];
    }

    const within = ordered.filter(
      (look) => look.seconds >= first.seconds && look.seconds <= last.seconds,
    );
    const after = ordered.find((look) => look.seconds > last.seconds);
    const ends = after === undefined ? durationSeconds : after.seconds;
    const lettered = run.filter((look) => look.yMax - look.yLow >= LETTERING_SPREAD).length;

    if (
      run.length / within.length < 0.5 ||
      ends - first.seconds < CREDITS_BOUNDS.minSeconds ||
      lettered * 2 <= run.length
    ) {
      return [];
    }

    const before = ordered.filter((look) => look.seconds < first.seconds).at(-1);

    return [
      {
        startSeconds: first.seconds,
        endSeconds:
          durationSeconds - ends <= CREDITS_BOUNDS.toTheEndWithinSeconds ? durationSeconds : ends,
        blackAt: first.seconds,
        storyBefore: before?.seconds ?? null,
      },
    ];
  });

  return credible.at(-1) ?? null;
};

/**
 * Finds the exact frame a cut to the credits falls on, from every frame between the last keyframe of
 * story and the first black one — keyframes can be ten seconds apart, and that much story is too
 * much to skip. The cut is where black begins and holds to the credits, not the first black frame,
 * which can be a fade inside the story.
 *
 * @param looks - Every frame between the two keyframes, in order.
 * @param minimum - The share of black a frame needs.
 * @returns The second black begins and holds from, or null where the last frame is not black.
 */
const findTheCut = (looks: readonly KeyframeLook[], minimum: number): number | null => {
  const ordered = looks.toSorted((a, b) => a.seconds - b.seconds);
  const lastStory = ordered.findLastIndex((look) => look.blackPercent < minimum);
  const cut = ordered[lastStory + 1];

  return cut === undefined ? null : cut.seconds;
};

export type { KeyframeLook, FoundCredits };

export { findCreditsInFrames, findTheCut, blackEnough };

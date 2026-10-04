import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

type NextEpisodeOffer = {
  secondsLeft: number;
  counted: number;
};

type OfferAsked = {
  segments: readonly MediaSegment[];
  positionSeconds: number;
  durationSeconds: number;
};

const CREDITS_RUN_TO_THE_END_WITHIN = 2;

const SHORTEST_RUNTIME_SECONDS = 10 * 60;

const OFFERED_BEFORE_THE_END: readonly { runsFor: number; seconds: number }[] = [
  { runsFor: 50 * 60, seconds: 40 },
  { runsFor: 40 * 60, seconds: 35 },
  { runsFor: 0, seconds: 30 },
];

/**
 * Finds the moment to start offering the next episode: as credits that run to the end begin, or a
 * little before the end of an episode long enough to have credits, whichever comes first.
 *
 * @param segments - The episode's marked stretches.
 * @param durationSeconds - How long it runs.
 * @returns The second the offer starts, or null where it is never offered.
 */
const offeredFrom = (segments: readonly MediaSegment[], durationSeconds: number): number | null => {
  const credits = segments.find(
    (segment) =>
      segment.kind === 'credits' &&
      segment.endSeconds >= durationSeconds - CREDITS_RUN_TO_THE_END_WITHIN,
  );
  const before = OFFERED_BEFORE_THE_END.find((step) => durationSeconds >= step.runsFor);
  const nearTheEnd =
    durationSeconds >= SHORTEST_RUNTIME_SECONDS && before !== undefined
      ? durationSeconds - before.seconds
      : null;

  if (credits === undefined) {
    return nearTheEnd;
  }

  return nearTheEnd === null ? credits.startSeconds : Math.min(credits.startSeconds, nearTheEnd);
};

/**
 * Whether to offer the next episode at this moment, as Jellyfin does, and how far the count to the
 * end of this one has got. The offer stands at the end itself, for a player held there.
 *
 * @param segments - The episode's marked stretches.
 * @param positionSeconds - Where the viewer is.
 * @param durationSeconds - How long the episode runs.
 * @returns The seconds left and the share of the count gone, from 0 to 1, or null where nothing is
 *   offered now.
 */
const nextEpisodeOfferAt = ({
  segments,
  positionSeconds,
  durationSeconds,
}: OfferAsked): NextEpisodeOffer | null => {
  if (
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    !Number.isFinite(positionSeconds)
  ) {
    return null;
  }

  const from = offeredFrom(segments, durationSeconds);

  if (from === null || positionSeconds < from) {
    return null;
  }

  const lasts = durationSeconds - from;

  return {
    secondsLeft: Math.max(durationSeconds - positionSeconds, 0),
    counted: lasts > 0 ? Math.min((positionSeconds - from) / lasts, 1) : 1,
  };
};

export type { NextEpisodeOffer, OfferAsked };

export { nextEpisodeOfferAt };

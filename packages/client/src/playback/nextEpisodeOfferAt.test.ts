import { describe, expect, it } from 'vitest';
import { nextEpisodeOfferAt } from './nextEpisodeOfferAt';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

const credits = (startSeconds: number, endSeconds: number): MediaSegment => ({
  kind: 'credits',
  startSeconds,
  endSeconds,
  source: 'imported',
});

const HALF_AN_HOUR = 30 * 60;

describe('nextEpisodeOfferAt', () => {
  it('offers the next episode as credits that run to the end begin', () => {
    const offer = nextEpisodeOfferAt({
      segments: [credits(1650, HALF_AN_HOUR)],
      positionSeconds: 1650,
      durationSeconds: HALF_AN_HOUR,
    });

    expect(offer).toEqual({ secondsLeft: 150, counted: 0 });
  });

  it('counts towards the end of the episode', () => {
    const offer = nextEpisodeOfferAt({
      segments: [credits(1650, HALF_AN_HOUR)],
      positionSeconds: 1725,
      durationSeconds: HALF_AN_HOUR,
    });

    expect(offer).toEqual({ secondsLeft: 75, counted: 0.5 });
  });

  it('takes credits that stop a second short of the end as running to it', () => {
    expect(
      nextEpisodeOfferAt({
        segments: [credits(1650, HALF_AN_HOUR - 1)],
        positionSeconds: 1660,
        durationSeconds: HALF_AN_HOUR,
      }),
    ).not.toBeNull();
  });

  it('waits for the end of an episode whose credits are followed by more of it', () => {
    const segments = [credits(1500, 1600)];

    expect(
      nextEpisodeOfferAt({ segments, positionSeconds: 1550, durationSeconds: HALF_AN_HOUR }),
    ).toBeNull();
    expect(
      nextEpisodeOfferAt({ segments, positionSeconds: 1770, durationSeconds: HALF_AN_HOUR }),
    ).not.toBeNull();
  });

  it('offers it thirty seconds before the end of an episode with nothing marked', () => {
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 1769, durationSeconds: HALF_AN_HOUR }),
    ).toBeNull();
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 1770, durationSeconds: HALF_AN_HOUR }),
    ).toEqual({ secondsLeft: 30, counted: 0 });
  });

  it('offers it thirty-five seconds before the end of one of forty minutes or more', () => {
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 2365, durationSeconds: 2400 }),
    ).not.toBeNull();
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 2364, durationSeconds: 2400 }),
    ).toBeNull();
  });

  it('offers it forty seconds before the end of one of fifty minutes or more', () => {
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 2960, durationSeconds: 3000 }),
    ).not.toBeNull();
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 2959, durationSeconds: 3000 }),
    ).toBeNull();
  });

  it('starts at whichever comes first, credits or the time before the end', () => {
    expect(
      nextEpisodeOfferAt({
        segments: [credits(1790, HALF_AN_HOUR)],
        positionSeconds: 1770,
        durationSeconds: HALF_AN_HOUR,
      }),
    ).not.toBeNull();
  });

  it('offers nothing near the end of an episode under ten minutes with nothing marked', () => {
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 590, durationSeconds: 599 }),
    ).toBeNull();
  });

  it('still offers it at the credits of a short episode', () => {
    expect(
      nextEpisodeOfferAt({
        segments: [credits(540, 599)],
        positionSeconds: 550,
        durationSeconds: 599,
      }),
    ).not.toBeNull();
  });

  it('keeps offering it at the end, with the count run out', () => {
    expect(
      nextEpisodeOfferAt({
        segments: [],
        positionSeconds: HALF_AN_HOUR + 1,
        durationSeconds: HALF_AN_HOUR,
      }),
    ).toEqual({ secondsLeft: 0, counted: 1 });
  });

  it('offers nothing while the length is not known', () => {
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 10, durationSeconds: 0 }),
    ).toBeNull();
    expect(
      nextEpisodeOfferAt({ segments: [], positionSeconds: 10, durationSeconds: Number.NaN }),
    ).toBeNull();
  });

  it('offers nothing while the position is not known', () => {
    expect(
      nextEpisodeOfferAt({
        segments: [],
        positionSeconds: Number.NaN,
        durationSeconds: HALF_AN_HOUR,
      }),
    ).toBeNull();
  });
});

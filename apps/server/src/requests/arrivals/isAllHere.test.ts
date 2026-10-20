import { describe, expect, it } from 'vitest';
import { isAllHere } from './isAllHere';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const episode = (state: RequestItem['state'], isFollowed = true, season = 2) => ({
  state,
  isFollowed,
  season,
});

const series = (
  ...items: { state: RequestItem['state']; isFollowed: boolean; season: number }[]
) => ({
  kind: 'series' as const,
  items: items.map((item, at) => ({
    id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
    musicBrainzId: null,
    episode: at + 1,
    title: '',
    airDate: null,
    problem: null,
    problemCode: null,
    releaseTitle: null,
    downloadId: null,
    filePath: null,
    score: null,
    lastSearchedAt: null,
    updatedAt: '2026-10-14T00:00:00.000Z',
    ...item,
  })),
});

describe('isAllHere', () => {
  it('waits for every episode asked for, not the first of them to arrive', () => {
    expect(isAllHere(series(episode('available'), episode('downloading')))).toBe(false);
    expect(isAllHere(series(episode('available'), episode('wanted')))).toBe(false);
    expect(isAllHere(series(episode('available'), episode('available')))).toBe(true);
  });

  it('waits for the rest of a season that has begun to air, not just the episodes out so far', () => {
    expect(isAllHere(series(episode('available'), episode('waiting'), episode('waiting')))).toBe(
      false,
    );
    expect(
      isAllHere(series(episode('available'), episode('available'), episode('available'))),
    ).toBe(true);
  });

  it('does not wait for a season none of which has aired yet', () => {
    expect(isAllHere(series(episode('available', true, 1), episode('waiting', true, 2)))).toBe(
      true,
    );
  });

  it('does not wait for episodes given up on or no longer followed', () => {
    expect(
      isAllHere(series(episode('available'), episode('failed'), episode('wanted', false))),
    ).toBe(true);
  });

  it('takes a film, an album or a book as here once it arrives', () => {
    expect(isAllHere({ kind: 'film', items: [] })).toBe(true);
  });
});

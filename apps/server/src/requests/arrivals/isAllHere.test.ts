import { describe, expect, it } from 'vitest';
import { isAllHere } from './isAllHere';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const episode = (state: RequestItem['state'], isFollowed = true) => ({ state, isFollowed });

const series = (...items: { state: RequestItem['state']; isFollowed: boolean }[]) => ({
  kind: 'series' as const,
  items: items.map((item, at) => ({
    id: `00000000-0000-4000-8000-${at.toString().padStart(12, '0')}`,
    musicBrainzId: null,
    season: 2,
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

  it('does not wait for episodes still to air, given up on, or no longer followed', () => {
    expect(
      isAllHere(
        series(
          episode('available'),
          episode('waiting'),
          episode('failed'),
          episode('wanted', false),
        ),
      ),
    ).toBe(true);
  });

  it('takes a film, an album or a book as here once it arrives', () => {
    expect(isAllHere({ kind: 'film', items: [] })).toBe(true);
  });
});

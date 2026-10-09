import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { isYetToComeOut } from './isYetToComeOut';

const TODAY = '2026-10-09';

describe('isYetToComeOut', () => {
  it('holds a film until its release day', () => {
    expect(
      isYetToComeOut(aMediaRequest({ state: 'waiting', releaseDate: '2026-12-01' }), TODAY),
    ).toBe(true);
    expect(
      isYetToComeOut(aMediaRequest({ state: 'waiting', releaseDate: '2026-01-01' }), TODAY),
    ).toBe(false);
  });

  it('holds a series until an episode it waits for airs', () => {
    const coming = aMediaRequest({
      kind: 'series',
      state: 'waiting',
      items: [aRequestItem({ state: 'waiting', season: 2, episode: 1, airDate: '2027-01-01' })],
    });
    const out = aMediaRequest({
      kind: 'series',
      state: 'waiting',
      items: [aRequestItem({ state: 'waiting', season: 2, episode: 1, airDate: '2026-01-01' })],
    });

    expect(isYetToComeOut(coming, TODAY)).toBe(true);
    expect(isYetToComeOut(out, TODAY)).toBe(false);
  });

  it('never holds a book, something still looked up, or something under way', () => {
    expect(isYetToComeOut(aMediaRequest({ kind: 'book', state: 'waiting' }), TODAY)).toBe(false);
    expect(isYetToComeOut(aMediaRequest({ kind: 'series', state: 'waiting' }), TODAY)).toBe(false);
    expect(
      isYetToComeOut(aMediaRequest({ state: 'downloading', releaseDate: '2027-01-01' }), TODAY),
    ).toBe(false);
  });
});

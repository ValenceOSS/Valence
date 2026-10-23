import { describe, expect, it } from 'vitest';
import { successorsOf } from './successorsOf';
import type { Identified } from './successorsOf';

/**
 * An item, as much of one as succession reads.
 *
 * @param id - Which item.
 * @param changes - What sets it apart.
 * @returns The item.
 */
const item = (id: string, changes: Partial<Identified> = {}): Identified => ({
  id,
  externalId: null,
  seriesId: null,
  seasonNumber: null,
  episodeNumber: null,
  extraKind: null,
  ...changes,
});

const episode = (id: string, seasonNumber: number, episodeNumber: number) =>
  item(id, { seriesId: 'show', seasonNumber, episodeNumber, externalId: 'tv:1' });

describe('successorsOf', () => {
  it('hands an episode on to the new copy of the same episode', () => {
    expect(
      successorsOf([episode('old', 1, 2)], [episode('one', 1, 1), episode('new', 1, 2)]),
    ).toEqual([{ from: 'old', to: 'new' }]);
  });

  it('hands a film on to the new copy the catalogue matched to the same film', () => {
    expect(
      successorsOf(
        [item('old', { externalId: 'movie:7' })],
        [item('other', { externalId: 'movie:8' }), item('new', { externalId: 'movie:7' })],
      ),
    ).toEqual([{ from: 'old', to: 'new' }]);
  });

  it('never hands an episode to a film that happens to share its catalogue match', () => {
    expect(successorsOf([episode('old', 1, 2)], [item('film', { externalId: 'tv:1' })])).toEqual(
      [],
    );
  });

  it('never hands an episode left out of any programme to another episode of its show', () => {
    const loose = (id: string, episodeNumber: number) =>
      item(id, { externalId: 'tv:1', seasonNumber: 1, episodeNumber });

    expect(successorsOf([loose('old', 2)], [loose('other', 3)])).toEqual([]);
  });

  it('hands nothing on where nothing was matched, nor from or to an extra', () => {
    expect(
      successorsOf(
        [item('unmatched'), item('trailer', { externalId: 'movie:7', extraKind: 'trailer' })],
        [item('new'), item('new trailer', { externalId: 'movie:7', extraKind: 'trailer' })],
      ),
    ).toEqual([]);
  });

  it('hands nothing on where the same thing simply went', () => {
    expect(successorsOf([episode('old', 1, 2)], [episode('one', 1, 1)])).toEqual([]);
  });
});

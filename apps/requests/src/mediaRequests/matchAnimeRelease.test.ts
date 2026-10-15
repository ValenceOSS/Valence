import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { anAnimeShow } from '@ValenceRequests/testing/anAnimeShow';
import { matchAnimeRelease } from './matchAnimeRelease';
import type { AnimeNumbering } from '@ValenceContracts/schemas/Anime';

const { anime, items } = anAnimeShow();

const request = (numberingByGroup: Record<string, AnimeNumbering> | null = null) => ({
  title: 'Show',
  aliases: [],
  anime,
  numberingByGroup,
});

const match = (
  name: string,
  options: { madeAt?: string; numberingByGroup?: Record<string, AnimeNumbering> } = {},
) =>
  matchAnimeRelease(
    request(options.numberingByGroup ?? null),
    items,
    parseReleaseName(name),
    name,
    options.madeAt ?? null,
  );

const heldBy = (name: string, options: Parameters<typeof match>[1] = {}) => {
  const found = match(name, options);

  return found.kind === 'matched'
    ? found.items.map((item) => `${String(item.season)}x${String(item.episode)}`)
    : found.kind;
};

describe('matchAnimeRelease', () => {
  it('reads a number counted from the first episode', () => {
    expect(heldBy('[Group] Show - 05 [1080p]')).toEqual(['1x5']);
    expect(heldBy('[Group] Show - 17 [1080p]')).toEqual(['1x17']);
    expect(heldBy('[Group] Shou - 30 [1080p]')).toEqual(['2x6']);
  });

  it("reads a cour's own name with its place in the cour", () => {
    expect(heldBy('[Group] Show Second Arc - 05 [1080p]')).toEqual(['1x17']);
    expect(heldBy('[Group] Show Second Arc - 17 [1080p]')).toEqual(['1x17']);
  });

  it('reads a batch of a cour', () => {
    expect(heldBy('[Group] Show Second Arc (01-12) [Batch]')).toHaveLength(12);
  });

  it("reads the catalogue's numbering where nothing else could be meant", () => {
    expect(heldBy('Show S01E13 1080p WEB H 264-GROUP')).toEqual(['1x13']);
  });

  it('holds a release that could be read more than one way, with a guess', () => {
    const found = match('[Group] Show S2 - 01 [1080p]');

    expect(found).toMatchObject({ kind: 'ambiguous', guess: 'perCour' });
    expect(found.kind === 'ambiguous' ? found.readings.map((one) => one.episodes) : []).toEqual([
      [{ season: 2, episode: 1 }],
      [{ season: 1, episode: 13 }],
    ]);
    expect(match('Show S02 1080p BluRay')).toMatchObject({ kind: 'ambiguous', guess: 'perCour' });
  });

  it('settles it the way its release group was answered for before', () => {
    expect(
      heldBy('[Group] Show S2 - 01 [1080p]', { numberingByGroup: { Group: 'perCour' } }),
    ).toEqual(['1x13']);
    expect(
      heldBy('[Group] Show S2 - 01 [1080p]', { numberingByGroup: { Group: 'aired' } }),
    ).toEqual(['2x1']);
  });

  it('reads it as somebody said it numbers its episodes', () => {
    const name = '[Other] Show S2 - 01 [1080p]';
    const found = matchAnimeRelease(
      request(),
      items,
      parseReleaseName(name),
      name,
      null,
      true,
      'perCour',
    );

    expect(found).toMatchObject({ kind: 'matched', numbering: 'perCour' });
  });

  it('drops a reading of episodes that had not aired when it was made', () => {
    expect(heldBy('[Group] Show S2 - 01 [1080p]', { madeAt: '2020-04-01' })).toEqual(['1x13']);
  });

  it('settles it by an episode title the release gives', () => {
    expect(heldBy('[Group] Show S2 - 01 - Episode Title 25 [1080p]')).toEqual(['2x1']);
  });

  it('reads a name in several languages by any of them', () => {
    expect(heldBy('[Group] 别名 / Show - 05 [1080p]')).toEqual(['1x5']);
  });

  it("reads a season named in a release as the cour that's named that", () => {
    const name = '[Group] Show S2 - 05 [1080p]';
    const found = matchAnimeRelease(
      {
        ...request(),
        anime: {
          ...anime,
          cours: anime.cours.map((cour) =>
            cour.cour === 3 ? { ...cour, name: 'Show Season 2', names: ['Show Season 2'] } : cour,
          ),
        },
      },
      items,
      parseReleaseName(name),
      name,
      null,
    );

    expect(found.kind === 'matched' ? found.items.map((item) => item.episode) : found.kind).toEqual(
      [5],
    );
    expect(found).toMatchObject({ numbering: 'aired' });
  });

  it('matches nothing of another show', () => {
    expect(match('[Group] Another Show - 05 [1080p]')).toEqual({ kind: 'none' });
  });
});

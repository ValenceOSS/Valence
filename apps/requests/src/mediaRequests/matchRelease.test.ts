import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { matchRelease } from './matchRelease';

const DUNE = { kind: 'film' as const, title: 'Dune', aliases: [], year: 2021 };

const FILM = [{ id: 'film', season: null, episode: null, airDate: null }];

const SEVERANCE = { kind: 'series' as const, title: 'Severance', aliases: [], year: 2022 };

/**
 * A series' episodes, numbered as asked.
 */
const episodes = (...numbers: Array<[number, number]>) =>
  numbers.map(([season, episode]) => ({
    id: `${season.toString()}x${episode.toString()}`,
    season,
    episode,
    airDate: `2022-02-${(10 + episode).toString()}`,
  }));

/**
 * The ids of what a release holds.
 */
const held = (
  request: Parameters<typeof matchRelease>[0],
  items: Parameters<typeof matchRelease>[1],
  name: string,
  madeAt: string | null = null,
) => matchRelease(request, items, parseReleaseName(name), madeAt).map((item) => item.id);

describe('matchRelease', () => {
  it('matches a film by its title and a year near enough', () => {
    expect(held(DUNE, FILM, 'Dune.2021.1080p.WEB-DL.DDP5.1.Atmos.H.264-FLUX')).toEqual(['film']);
    expect(held(DUNE, FILM, 'Dune.2022.2160p.UHD.BluRay.x265-GRP')).toEqual(['film']);
    expect(held(DUNE, FILM, 'Dune.1984.1080p.BluRay.x264-GRP')).toEqual([]);
    expect(held(DUNE, FILM, 'Dune.Part.Two.2024.1080p.WEB-DL.x264-GRP')).toEqual([]);
  });

  it('does not take an episode for a film', () => {
    expect(held(DUNE, FILM, 'Dune.S01E01.1080p.WEB-DL.x264-GRP')).toEqual([]);
  });

  it('matches a film by another title it goes by', () => {
    expect(
      held(
        { ...DUNE, title: 'Spirited Away', aliases: ['Sen to Chihiro no Kamikakushi'], year: 2001 },
        FILM,
        'Sen.to.Chihiro.no.Kamikakushi.2001.1080p.BluRay.x264-GRP',
      ),
    ).toEqual(['film']);
  });

  it('matches an episode, several, or a whole season', () => {
    const items = episodes([1, 1], [1, 2], [1, 3], [2, 1]);

    expect(held(SEVERANCE, items, 'Severance.S01E02.1080p.WEB.H264-GRP')).toEqual(['1x2']);
    expect(held(SEVERANCE, items, 'Severance.S01E01E02.1080p.WEB.H264-GRP')).toEqual([
      '1x1',
      '1x2',
    ]);
    expect(held(SEVERANCE, items, 'Severance.S01.1080p.ATVP.WEB-DL.DDP5.1.H.264-GRP')).toEqual([
      '1x1',
      '1x2',
      '1x3',
    ]);
    expect(held(SEVERANCE, items, 'Severance.Complete.Series.1080p.WEB-DL-GRP')).toEqual([
      '1x1',
      '1x2',
      '1x3',
      '2x1',
    ]);
    expect(held(SEVERANCE, items, 'Silo.S01E02.1080p.WEB.H264-GRP')).toEqual([]);
  });

  it('credits a whole run only with what had aired the day it was made', () => {
    const daredevil = { kind: 'series' as const, title: 'Daredevil', aliases: [], year: 2015 };
    const items = [
      { id: '1x1', season: 1, episode: 1, airDate: '2015-04-10' },
      { id: '1x2', season: 1, episode: 2, airDate: '2015-04-17' },
      { id: '4x1', season: 4, episode: 1, airDate: '2024-03-05' },
    ];
    const pack = 'Daredevil.COMPLETE.SERIES.1080p.WEB-DL-GRP';

    expect(held(daredevil, items, pack, '2018-10-20')).toEqual(['1x1', '1x2']);
    expect(held(daredevil, items, pack, '2024-06-01')).toEqual(['1x1', '1x2', '4x1']);
    expect(held(daredevil, items, pack)).toEqual(['1x1', '1x2', '4x1']);
  });

  it('credits a whole season only with what had aired the day it was made', () => {
    const items = [
      { id: '1x1', season: 1, episode: 1, airDate: '2022-02-18' },
      { id: '1x2', season: 1, episode: 2, airDate: '2022-02-25' },
    ];

    expect(held(SEVERANCE, items, 'Severance.S01.1080p.WEB-DL-GRP', '2022-02-20')).toEqual(['1x1']);
    expect(held(SEVERANCE, items, 'Severance.S01E02.1080p.WEB-DL-GRP', '2022-02-20')).toEqual([
      '1x2',
    ]);
  });

  it('matches an episode by the day it aired', () => {
    expect(
      held(SEVERANCE, episodes([1, 1], [1, 2]), 'Severance.2022.02.12.1080p.WEB.H264-GRP'),
    ).toEqual(['1x2']);
  });

  it('counts an episode numbered from the first through every season', () => {
    const frieren = { kind: 'series' as const, title: 'Frieren', aliases: [], year: 2023 };
    const items = episodes([1, 1], [1, 2], [2, 1], [2, 2]);

    expect(held(frieren, items, '[SubsPlease] Frieren - 03 (1080p) [ABCDEF12].mkv')).toEqual([
      '2x1',
    ]);
    expect(
      held(frieren, items.slice(2), '[SubsPlease] Frieren - 03 (1080p) [ABCDEF12].mkv'),
    ).toEqual([]);
  });
});

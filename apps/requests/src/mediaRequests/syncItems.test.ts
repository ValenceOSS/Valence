import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { syncItems } from './syncItems';

const SERIES = aMediaRequest({ kind: 'series', title: 'Severance', seasons: null });

const EPISODES = [
  { season: 0, episode: 1, title: 'Behind the scenes', airDate: '2022-01-01' },
  { season: 1, episode: 1, title: 'Good News About Hell', airDate: '2022-02-18' },
  { season: 1, episode: 2, title: 'Half Loop', airDate: '2022-02-18' },
  { season: 2, episode: 1, title: 'Hello, Ms. Cobel', airDate: null },
];

describe('syncItems', () => {
  it('waits for a film until its release', () => {
    expect(syncItems(aMediaRequest(), [], []).add).toEqual([
      { season: null, episode: null, title: 'Dune', airDate: '2021-12-03' },
    ]);
  });

  it('waits for every regular episode where no seasons were named', () => {
    expect(syncItems(SERIES, EPISODES, []).add.map((item) => item.title)).toEqual([
      'Good News About Hell',
      'Half Loop',
      'Hello, Ms. Cobel',
    ]);
  });

  it('waits for the seasons named, specials included', () => {
    expect(
      syncItems({ ...SERIES, seasons: [0, 2] }, EPISODES, []).add.map((item) => item.title),
    ).toEqual(['Behind the scenes', 'Hello, Ms. Cobel']);
  });

  it('changes what the catalogue renamed or re-dated, and adds only what is new', () => {
    const kept = aRequestItem({ season: 1, episode: 1, title: 'Pilot', airDate: '2022-02-18' });
    const changes = syncItems(SERIES, EPISODES, [kept]);

    expect(changes.change).toEqual([
      { id: kept.id, changes: { title: 'Good News About Hell', airDate: '2022-02-18' } },
    ]);
    expect(changes.add).toHaveLength(2);
  });

  it('lets go of what is no longer asked for, unless it is coming or here', () => {
    const wanted = aRequestItem({ id: 'wanted', season: 2, episode: 1, state: 'wanted' });
    const coming = aRequestItem({ id: 'coming', season: 2, episode: 2, state: 'downloading' });

    expect(syncItems({ ...SERIES, seasons: [1] }, EPISODES, [wanted, coming]).remove).toEqual([
      'wanted',
    ]);
  });
});

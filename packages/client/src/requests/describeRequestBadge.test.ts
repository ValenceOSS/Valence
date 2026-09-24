import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { describeRequestBadge } from '@ValenceClient/requests/describeRequestBadge';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const EPISODE: RequestItem = {
  id: '6ba7b810-9dad-11d1-80b4-000000000001',
  musicBrainzId: null,
  season: 1,
  episode: 1,
  title: '',
  airDate: '2026-10-02',
  state: 'waiting',
  problem: null,
  problemCode: null,
  releaseTitle: null,
  downloadId: null,
  filePath: null,
  score: null,
  downloadedBytes: null,
  downloadSeconds: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const TODAY = '2026-09-20';

const BEFORE_RELEASE = '2021-01-01';

describe('describeRequestBadge', () => {
  it('says what a request waits for', () => {
    expect(describeRequestBadge(aMediaRequest({ state: 'awaitingApproval' })).label).toBe(
      'Awaiting approval',
    );
    expect(describeRequestBadge(aMediaRequest({ state: 'waiting' }), BEFORE_RELEASE).detail).toBe(
      'Held until 3 Dec 2021, when its quality profile says it is out.',
    );
    expect(
      describeRequestBadge(aMediaRequest({ state: 'waiting', releaseDate: null }), TODAY).label,
    ).toBe('Queued to search');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'series', items: [EPISODE] }),
        TODAY,
      ).detail,
    ).toBe('The next episode airs 2 Oct 2026.');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'series', items: [{ ...EPISODE, airDate: null }] }),
        TODAY,
      ).detail,
    ).toBe('Waiting for the next episode to be announced.');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'artist', items: [EPISODE] }),
        TODAY,
      ).detail,
    ).toBe('Out 2 Oct 2026.');
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'album', items: [{ ...EPISODE, airDate: null }] }),
        TODAY,
      ).detail,
    ).toBe('Waiting for the next album to be announced.');
  });

  it('says a book waits to be added by hand, and is never queued for a search', () => {
    for (const state of ['waiting', 'wanted', 'searching'] as const) {
      const badge = describeRequestBadge(
        aMediaRequest({ kind: 'book', tmdbId: null, openLibraryId: 5, state, items: [] }),
        TODAY,
      );

      expect(badge.label).toBe('Waiting to be added');
      expect(badge.detail).toMatch(/added to the library by hand/);
    }
  });

  it('says a book that has been added is available, like anything else', () => {
    expect(
      describeRequestBadge(
        aMediaRequest({ kind: 'book', tmdbId: null, openLibraryId: 5, state: 'available' }),
        TODAY,
      ).label,
    ).toBe('Done');
  });

  it('says what has come out is queued for a search, not that it is not out yet', () => {
    expect(describeRequestBadge(aMediaRequest({ state: 'waiting' }), '2022-01-01')).toMatchObject({
      label: 'Queued to search',
      tone: 'waiting',
    });
    expect(
      describeRequestBadge(
        aMediaRequest({ state: 'waiting', kind: 'series', items: [EPISODE] }),
        '2026-10-02',
      ).label,
    ).toBe('Queued to search');
  });

  it('says a request whose films or episodes are not known yet is being looked up', () => {
    expect(
      describeRequestBadge(aMediaRequest({ state: 'waiting', kind: 'series', items: [] }), TODAY),
    ).toMatchObject({ label: 'Looking it up', tone: 'busy' });
  });

  it('says what went wrong, or what is on its way', () => {
    expect(
      describeRequestBadge(aMediaRequest({ state: 'refused', refusedBecause: 'No room' })),
    ).toEqual({ label: 'Refused', tone: 'danger', detail: 'No room' });
    expect(describeRequestBadge(aMediaRequest()).detail).toBe(
      'Searched for again every few hours.',
    );
    expect(describeRequestBadge(aMediaRequest({ isPickedByHand: true })).detail).toBe(
      'Waiting for a release to be picked by hand.',
    );
    expect(
      describeRequestBadge(aMediaRequest({ problem: 'Nothing yet', problemCode: null })).detail,
    ).toBe('Nothing yet');
    expect(
      describeRequestBadge(
        aMediaRequest({
          state: 'downloading',
          items: [{ ...EPISODE, state: 'downloading', releaseTitle: 'Dune.2021.1080p' }],
        }),
      ).detail,
    ).toBe('Dune.2021.1080p');
    expect(describeRequestBadge(aMediaRequest({ state: 'downloading' })).detail).toBeNull();
    expect(describeRequestBadge(aMediaRequest({ state: 'failed' })).detail).toBe('It failed.');
  });

  it('points at what explains its problem, where one does', () => {
    expect(
      describeRequestBadge(
        aMediaRequest({
          state: 'filing',
          problem: 'The requests service may not write to /media/Films.',
          problemCode: 'MayNotWriteToLibrary',
        }),
      ),
    ).toMatchObject({
      label: 'Filing',
      help: 'https://docs.getvalence.app/install/requesting#it-may-not-write-to-a-folder',
    });
    expect(
      describeRequestBadge(
        aMediaRequest({
          state: 'failed',
          problem: 'Refused',
          problemCode: 'CloudflareRefusesAddress',
        }),
      ).help,
    ).toBe(
      'https://docs.getvalence.app/install/requesting#a-sites-cloudflare-refuses-your-address',
    );
    expect(describeRequestBadge(aMediaRequest({ state: 'wanted' })).help).toBeNull();
  });

  it('names every other state', () => {
    expect(
      (['searching', 'chosen', 'filing', 'filed', 'available'] as const).map(
        (state) => describeRequestBadge(aMediaRequest({ state })).label,
      ),
    ).toEqual(['Searching', 'Release chosen', 'Filing', 'Filed', 'Done']);
  });
});

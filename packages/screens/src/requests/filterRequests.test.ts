import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { filterRequests } from './filterRequests';

const DUNE = aMediaRequest({ title: 'Dune', kind: 'film', state: 'awaitingApproval' });
const SEVERANCE = aMediaRequest({ title: 'Severance', kind: 'series', state: 'refused' });
const ALL = [DUNE, SEVERANCE];

describe('filterRequests', () => {
  it('leaves every request where nothing is ticked or typed', () => {
    expect(filterRequests(ALL, new Set(), '')).toEqual(ALL);
  });

  it('keeps a request that matches any one of the kinds ticked', () => {
    expect(filterRequests(ALL, new Set(['kind:film', 'kind:series']), '')).toEqual(ALL);
    expect(filterRequests(ALL, new Set(['kind:series']), '')).toEqual([SEVERANCE]);
  });

  it('asks for a kind in a place when both are ticked', () => {
    expect(filterRequests(ALL, new Set(['kind:film', 'state:Refused']), '')).toEqual([]);
    expect(filterRequests(ALL, new Set(['kind:film', 'state:Awaiting approval']), '')).toEqual([
      DUNE,
    ]);
  });

  it('matches what was typed against the title, ignoring case and padding', () => {
    expect(filterRequests(ALL, new Set(), '  sever ')).toEqual([SEVERANCE]);
  });

  it('matches what was typed against who asked as well', () => {
    const asker = ALL[0]?.requestedBy.name ?? '';

    expect(filterRequests(ALL, new Set(), asker.toUpperCase())).toEqual(ALL);
  });

  it('keeps a request in any one of the libraries ticked', () => {
    const shows = aMediaRequest({ title: 'Severance', libraryId: 'shows' });
    const both = [DUNE, shows];

    expect(filterRequests(both, new Set(['library:shows']), '')).toEqual([shows]);
    expect(filterRequests(both, new Set(['library:films', 'library:shows']), '')).toEqual(both);
  });

  it('keeps a request asked for by any one of the people ticked', () => {
    const theirs = aMediaRequest({ requestedBy: { id: 'dan', name: 'Dan' } });
    const both = [DUNE, theirs];

    expect(filterRequests(both, new Set(['who:dan']), '')).toEqual([theirs]);
  });

  it('keeps a request judged at any one of the qualities ticked', () => {
    const ultra = aMediaRequest({ title: 'Arrival', profileName: '4K' });
    const both = [DUNE, ultra];

    expect(filterRequests(both, new Set(['quality:4K']), '')).toEqual([ultra]);
  });

  it('lets a request judged at no quality be asked for like any other', () => {
    const ultra = aMediaRequest({ title: 'Arrival', profileName: '4K' });

    expect(filterRequests([DUNE, ultra], new Set(['quality:']), '')).toEqual([DUNE]);
  });
});

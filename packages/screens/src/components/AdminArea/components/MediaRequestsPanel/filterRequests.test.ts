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
});

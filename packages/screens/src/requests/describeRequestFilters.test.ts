import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { describeRequestFilters } from './describeRequestFilters';

describe('describeRequestFilters', () => {
  it('offers every kind that can be asked for, whether or not any have been', () => {
    const [kind] = describeRequestFilters([]);

    expect(kind?.options.map((option) => option.label)).toEqual([
      'Film',
      'Series',
      'Artist',
      'Album',
    ]);
  });

  it('offers only the places requests actually are, once each and in order', () => {
    const [, where] = describeRequestFilters([
      aMediaRequest({ state: 'refused' }),
      aMediaRequest({ state: 'awaitingApproval' }),
      aMediaRequest({ state: 'refused' }),
    ]);

    expect(where?.options.map((option) => option.label)).toEqual(['Awaiting approval', 'Refused']);
  });

  it('names the libraries requests are actually for, and nothing else', () => {
    const groups = describeRequestFilters(
      [aMediaRequest({ libraryId: 'films' }), aMediaRequest({ libraryId: 'shows' })],
      new Map([
        ['films', 'Films'],
        ['shows', 'Shows'],
        ['music', 'Music'],
      ]),
    );

    expect(groups.find((group) => group.name === 'Library')?.options).toEqual([
      { id: 'library:films', label: 'Films' },
      { id: 'library:shows', label: 'Shows' },
    ]);
  });

  it('says so plainly where a request is for a library that has gone', () => {
    const groups = describeRequestFilters(
      [aMediaRequest({ libraryId: 'films' }), aMediaRequest({ libraryId: 'gone' })],
      new Map([['films', 'Films']]),
    );

    expect(
      groups.find((group) => group.name === 'Library')?.options.map((option) => option.label),
    ).toEqual(['A library that has gone', 'Films']);
  });

  it('offers who asked, once each', () => {
    const groups = describeRequestFilters([
      aMediaRequest({ requestedBy: { id: 'dan', name: 'Dan' } }),
      aMediaRequest({ requestedBy: { id: 'sam', name: 'Sam' } }),
      aMediaRequest({ requestedBy: { id: 'dan', name: 'Dan' } }),
    ]);

    expect(groups.find((group) => group.name === 'Asked by')?.options).toEqual([
      { id: 'who:dan', label: 'Dan' },
      { id: 'who:sam', label: 'Sam' },
    ]);
  });

  it('offers the qualities in play, saying plainly where there is none', () => {
    const groups = describeRequestFilters([
      aMediaRequest({ profileName: '4K' }),
      aMediaRequest({ profileName: null }),
    ]);

    expect(groups.find((group) => group.name === 'Quality')?.options).toEqual([
      { id: 'quality:', label: 'No quality set' },
      { id: 'quality:4K', label: '4K' },
    ]);
  });

  it('leaves out a group with nothing to choose between, which would narrow nothing', () => {
    const groups = describeRequestFilters(
      [aMediaRequest({ libraryId: 'films' }), aMediaRequest({ libraryId: 'films' })],
      new Map([['films', 'Films']]),
    );

    expect(groups.map((group) => group.name)).toEqual(['Kind', 'Where it is']);
  });
});

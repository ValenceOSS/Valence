import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useDiscoverSearch } from './useDiscoverSearch';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';
import type { RequestsAvailability } from '@ValenceContracts/schemas/Requests';
import type { MyPermissions } from '@ValenceContracts/schemas/Permission';

const searchAskable = vi.fn<(query: string, kind: MediaRequestKind) => Promise<CatalogueTitle[]>>();
const fetchRequestsAvailability = vi.fn<() => Promise<RequestsAvailability>>();
const fetchMyPermissions = vi.fn<() => Promise<MyPermissions>>();

vi.mock('@ValenceClient/requests/fetchAskable', async (actual) => ({
  ...(await actual<object>()),
  searchAskable: (query: string, kind: MediaRequestKind) => searchAskable(query, kind),
}));

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => fetchRequestsAvailability(),
  fetchRequestsOverview: vi.fn(),
}));

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({
  fetchMyPermissions: () => fetchMyPermissions(),
}));

beforeEach(() => {
  searchAskable.mockReset().mockImplementation((_query, kind) =>
    Promise.resolve([
      aCatalogueTitle({ kind, id: `${kind}-1` }),
      aCatalogueTitle({
        kind,
        id: `${kind}-held`,
        standing: { status: 'library', mediaId: 'm', requestId: null, requestState: null },
      }),
    ]),
  );
  fetchRequestsAvailability
    .mockReset()
    .mockResolvedValue({ isEnabled: true, kinds: ['film', 'book'] });
  fetchMyPermissions
    .mockReset()
    .mockResolvedValue({ permissions: ['requests.ask'], isAdministrator: false });
});

describe('useDiscoverSearch', () => {
  it('finds what is not in the library, of the kinds a library takes, for whoever may ask', async () => {
    const { result } = renderHookInACache(() => useDiscoverSearch('dune'));

    await waitFor(() => {
      expect(result.current.count).toBe(2);
    });
    expect(result.current.films.map((title) => title.id)).toEqual(['film-1']);
    expect(result.current.books.map((title) => title.id)).toEqual(['book-1']);
    expect(result.current.shows).toEqual([]);
    expect(searchAskable).not.toHaveBeenCalledWith('dune', 'series');
    expect(searchAskable).not.toHaveBeenCalledWith('dune', 'artist');
  });

  it('says why it found nothing where a catalogue could not be searched', async () => {
    searchAskable.mockImplementation((_query, kind) =>
      kind === 'film'
        ? Promise.reject(
            new RequestFailed('/api/requests/catalogue/search', 503, false, 'Couldn’t reach TMDB.'),
          )
        : Promise.resolve([]),
    );

    const { result } = renderHookInACache(() => useDiscoverSearch('dune'));

    await waitFor(() => {
      expect(result.current.problem).toBe('Couldn’t reach TMDB.');
    });
    expect(result.current.count).toBe(0);
  });

  it('shows what one catalogue found while another could not be searched', async () => {
    searchAskable.mockImplementation((_query, kind) =>
      kind === 'film'
        ? Promise.reject(new RequestFailed('/api/requests/catalogue/search', 503))
        : Promise.resolve([aCatalogueTitle({ kind, id: `${kind}-1` })]),
    );

    const { result } = renderHookInACache(() => useDiscoverSearch('dune'));

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });
    expect(result.current.problem).toBeNull();
  });

  it('asks nothing for no words', () => {
    renderHookInACache(() => useDiscoverSearch('  '));

    expect(searchAskable).not.toHaveBeenCalled();
  });
});

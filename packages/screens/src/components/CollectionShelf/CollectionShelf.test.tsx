import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CollectionShelf } from './CollectionShelf';

const held = vi.hoisted(() => ({ mayEdit: false, hasSmart: false }));

const collections = vi.hoisted(() => ({
  fetchCollections: vi.fn(),
  fetchCollection: vi.fn(),
  collectionArtworkUrl: vi.fn(() => null),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

vi.mock('@ValenceClient/about/useServerHas', () => ({ useServerHas: () => held.hasSmart }));

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () =>
    Promise.resolve({
      genres: [],
      decades: [],
      maxRating: 10,
      audioLanguages: [],
      audioCodecs: [],
      audioChannels: [],
    }),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => Promise.resolve([]),
  fetchLibraryItems: () => Promise.resolve({ items: [], total: 0 }),
}));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({
    may: (permission: string) => permission === 'library.edit' && held.mayEdit,
    mayAdminister: false,
    isLoading: false,
  }),
}));

const SAGA = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: true,
  hasOwnArtwork: false,
  isSmart: false,
  holds: ['film'],
  rules: null,
  owner: null,
  isMine: false,
  isShared: false,
  entryCount: 2,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  held.mayEdit = false;
  held.hasSmart = false;
  collections.fetchCollections.mockReset();
  collections.fetchCollections.mockResolvedValue([SAGA]);
});

describe('CollectionShelf', () => {
  it('shows the collections, and opens the one chosen', async () => {
    const onOpen = vi.fn();

    renderInAnAddress(<CollectionShelf holds="film" onOpen={onOpen} />);
    await userEvent.click(await screen.findByRole('button', { name: /Saga/ }));

    expect(onOpen).toHaveBeenCalledWith(SAGA.id);
    expect(collections.fetchCollections).toHaveBeenCalledWith({ withEmpty: false });
  });

  it('asks for the empty ones too for somebody who looks after the libraries', async () => {
    held.mayEdit = true;

    renderInAnAddress(<CollectionShelf holds="film" onOpen={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Saga/ })).toBeInTheDocument();
    expect(collections.fetchCollections).toHaveBeenCalledWith({ withEmpty: true });
  });

  it('says nothing where there are no collections, not even its heading', async () => {
    collections.fetchCollections.mockResolvedValue([]);

    const { container } = renderInAnAddress(<CollectionShelf holds="film" onOpen={vi.fn()} />);

    await vi.waitFor(
      () => {
        expect(collections.fetchCollections).toHaveBeenCalled();
      },
      { timeout: 5_000 },
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('leaves out the collections of the other kind', async () => {
    const { container } = renderInAnAddress(<CollectionShelf holds="series" onOpen={vi.fn()} />);

    await vi.waitFor(
      () => {
        expect(collections.fetchCollections).toHaveBeenCalled();
      },
      { timeout: 5_000 },
    );
    expect(container).toBeEmptyDOMElement();
  });
});

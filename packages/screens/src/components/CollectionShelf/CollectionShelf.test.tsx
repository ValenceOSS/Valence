import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CollectionShelf } from './CollectionShelf';

const held = vi.hoisted(() => ({ mayEdit: false }));

const collections = vi.hoisted(() => ({
  fetchCollections: vi.fn(),
  fetchCollection: vi.fn(),
  collectionArtworkUrl: vi.fn(() => null),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

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
  entryCount: 2,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

beforeEach(() => {
  held.mayEdit = false;
  collections.fetchCollections.mockReset();
  collections.fetchCollections.mockResolvedValue([SAGA]);
});

describe('CollectionShelf', () => {
  it('shows the collections, and opens the one chosen', async () => {
    const onOpen = vi.fn();

    renderInAnAddress(<CollectionShelf onOpen={onOpen} />);
    await userEvent.click(await screen.findByRole('button', { name: /Saga/ }));

    expect(onOpen).toHaveBeenCalledWith(SAGA.id);
    expect(collections.fetchCollections).toHaveBeenCalledWith({ withEmpty: false });
    expect(screen.queryByRole('button', { name: /New collection/ })).not.toBeInTheDocument();
  });

  it('says nothing where there are no collections', async () => {
    collections.fetchCollections.mockResolvedValue([]);

    const { container } = renderInAnAddress(<CollectionShelf onOpen={vi.fn()} />);

    await vi.waitFor(() => {
      expect(collections.fetchCollections).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('lets somebody who looks after the libraries see the empty ones and start a new one', async () => {
    held.mayEdit = true;

    renderInAnAddress(<CollectionShelf onOpen={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /New collection/ }));

    expect(collections.fetchCollections).toHaveBeenCalledWith({ withEmpty: true });
    expect(await screen.findByRole('dialog', { name: 'New collection' })).toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AddToCollectionDialog } from './AddToCollectionDialog';
import type { CollectionListing } from '@ValenceClient/collections/fetchCollections';

const collections = vi.hoisted(() => ({
  fetchCollections: vi.fn(),
  fetchCollection: vi.fn(),
  addToCollection: vi.fn(),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
}));

const told = vi.hoisted(() => ({ worked: vi.fn(), failed: vi.fn() }));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

vi.mock('@ValenceUI/notify', () => ({ notify: told }));

/**
 * A collection with only what the dialog shows.
 *
 * @param id - Which one.
 * @param name - What it is called.
 * @returns The collection.
 */
const aCollection = (id: string, name: string) => ({
  id,
  name,
  description: null,
  isOrdered: false,
  hasOwnArtwork: false,
  entryCount: 1,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
});

const SAGA = aCollection('00000000-0000-4000-8000-00000000c011', 'Saga');

const BOX = aCollection('00000000-0000-4000-8000-00000000c012', 'Box set');

beforeEach(() => {
  told.worked.mockReset();
  told.failed.mockReset();
  collections.addToCollection.mockReset();
  collections.addToCollection.mockResolvedValue(true);
  collections.fetchCollections.mockReset();
  collections.fetchCollections.mockImplementation((listing: CollectionListing) =>
    Promise.resolve(listing.containing === undefined ? [SAGA, BOX] : [BOX]),
  );
});

describe('AddToCollectionDialog', () => {
  it('adds a title to the collection chosen, and says where it went', async () => {
    const onClose = vi.fn();

    renderInAnAddress(
      <AddToCollectionDialog subject={{ mediaItemId: 'film' }} title="Hope" onClose={onClose} />,
    );

    await userEvent.click(await screen.findByRole('radio', { name: /Saga/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(collections.addToCollection).toHaveBeenCalledWith(SAGA.id, [{ mediaItemId: 'film' }]);
    expect(told.worked).toHaveBeenCalledWith('Hope is now in Saga.');
  });

  it('will not add a title to a collection it is already in', async () => {
    renderInAnAddress(
      <AddToCollectionDialog subject={{ mediaItemId: 'film' }} title="Hope" onClose={vi.fn()} />,
    );

    expect(await screen.findByRole('radio', { name: /Box set/ })).toBeDisabled();
    expect(screen.getByText('Already in it')).toBeInTheDocument();
  });

  it('says so when it could not be added', async () => {
    collections.addToCollection.mockResolvedValue(false);

    renderInAnAddress(
      <AddToCollectionDialog subject={{ seriesId: 'show' }} title="Show" onClose={vi.fn()} />,
    );

    await userEvent.click(await screen.findByRole('radio', { name: /Saga/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(told.failed).toHaveBeenCalledWith('That could not be added to the collection.');
    });
  });

  it('makes a new collection around the title', async () => {
    renderInAnAddress(
      <AddToCollectionDialog subject={{ seriesId: 'show' }} title="Show" onClose={vi.fn()} />,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'New collection' }));

    expect(await screen.findByRole('dialog', { name: 'New collection' })).toBeInTheDocument();
  });

  it('shows nothing while nothing is being added', () => {
    renderInAnAddress(<AddToCollectionDialog subject={null} title="" onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(collections.fetchCollections).not.toHaveBeenCalled();
  });
});

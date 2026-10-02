import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CollectionEditDialog } from './CollectionEditDialog';

const collections = vi.hoisted(() => ({
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  collectionArtworkUrl: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

const SAGA = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: false,
  hasOwnArtwork: false,
  entryCount: 0,
  coverMediaIds: [],
  updatedAt: '',
};

beforeEach(() => {
  collections.createCollection.mockReset();
  collections.updateCollection.mockReset();
  collections.createCollection.mockResolvedValue(SAGA);
  collections.updateCollection.mockResolvedValue(true);
});

describe('CollectionEditDialog', () => {
  it('makes a collection holding what it was opened with, and says which it made', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(
      <CollectionEditDialog
        isOpen
        onClose={vi.fn()}
        onSaved={onSaved}
        startsWith={[{ mediaItemId: 'film' }]}
      />,
    );

    await userEvent.type(screen.getByLabelText('Name'), 'Saga');
    await userEvent.click(screen.getByRole('switch', { name: 'The order matters' }));
    await userEvent.click(screen.getByRole('button', { name: 'Make it' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(SAGA.id);
    });
    expect(collections.createCollection).toHaveBeenCalledWith({
      name: 'Saga',
      description: null,
      isOrdered: true,
      entries: [{ mediaItemId: 'film' }],
    });
  });

  it('will not make a collection with no name', async () => {
    renderInAnAddress(<CollectionEditDialog isOpen onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Make it' }));

    expect(await screen.findByText('A collection needs a name.')).toBeInTheDocument();
    expect(collections.createCollection).not.toHaveBeenCalled();
  });

  it('says so when a collection could not be made', async () => {
    collections.createCollection.mockResolvedValue(null);

    renderInAnAddress(<CollectionEditDialog isOpen onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Saga');
    await userEvent.click(screen.getByRole('button', { name: 'Make it' }));

    expect(await screen.findByText('That collection could not be made.')).toBeInTheDocument();
  });

  it('changes a collection it was opened on', async () => {
    const onClose = vi.fn();

    renderInAnAddress(<CollectionEditDialog isOpen onClose={onClose} collection={SAGA} />);

    await userEvent.type(screen.getByLabelText('Description'), 'Every one of them');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(collections.updateCollection).toHaveBeenCalledWith(SAGA.id, {
      name: 'Saga',
      description: 'Every one of them',
      isOrdered: false,
    });
  });
});

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

const mayEditLibraries = vi.hoisted(() => vi.fn<() => boolean>(() => false));

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => mayEditLibraries(), mayAdminister: false, isDemo: false }),
}));

vi.mock('@ValenceClient/library/fetchFacets', () => ({
  fetchFacets: () =>
    Promise.resolve({
      genres: ['Drama'],
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

const SAGA = {
  id: '00000000-0000-4000-8000-00000000c011',
  name: 'Saga',
  description: null,
  isOrdered: false,
  hasOwnArtwork: false,
  isSmart: false,
  holds: ['film' as const, 'series' as const],
  rules: null,
  owner: null,
  isMine: false,
  isShared: false,
  entryCount: 0,
  coverMediaIds: [],
  updatedAt: '',
};

beforeEach(() => {
  mayEditLibraries.mockReturnValue(false);
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
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

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

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('A collection needs a name.')).toBeInTheDocument();
    expect(collections.createCollection).not.toHaveBeenCalled();
  });

  it('says so when a collection could not be made', async () => {
    collections.createCollection.mockResolvedValue(null);

    renderInAnAddress(<CollectionEditDialog isOpen onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'Saga');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Couldn’t create the collection. Try again.'),
    ).toBeInTheDocument();
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

  it('makes a smart collection of somebody’s own where they do not look after the libraries', async () => {
    renderInAnAddress(<CollectionEditDialog isOpen isSmart onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'New smart collection' })).toBeInTheDocument();
    expect(screen.queryByText('Who sees it')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Name'), 'Unwatched');
    await userEvent.click(screen.getByRole('button', { name: 'Add a rule' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(collections.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unwatched',
          isPersonal: true,
          rules: {
            holds: 'films',
            rules: [{ kind: 'watched', state: 'unwatched' }],
            order: 'added',
            limit: null,
          },
        }),
      );
    });
  });

  it('lets somebody who looks after the libraries make a smart one for everyone', async () => {
    mayEditLibraries.mockReturnValue(true);
    renderInAnAddress(<CollectionEditDialog isOpen isSmart onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('Name'), 'For everyone');
    await userEvent.click(screen.getByRole('button', { name: 'Everyone' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(collections.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({ isPersonal: false }),
      );
    });
  });

  it('starts from the rules it was opened with', async () => {
    renderInAnAddress(
      <CollectionEditDialog
        isOpen
        isSmart
        onClose={vi.fn()}
        startsWithRules={{
          holds: 'series',
          rules: [{ kind: 'genre', anyOf: ['Drama'], isNegated: false }],
          order: 'rating',
          limit: null,
        }}
      />,
    );

    await userEvent.type(screen.getByLabelText('Name'), 'Dramas');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(collections.createCollection).toHaveBeenCalledWith(
        expect.objectContaining({
          rules: {
            holds: 'series',
            rules: [{ kind: 'genre', anyOf: ['Drama'], isNegated: false }],
            order: 'rating',
            limit: null,
          },
        }),
      );
    });
  });

  it('shares somebody’s own smart collection with everyone', async () => {
    renderInAnAddress(
      <CollectionEditDialog
        isOpen
        onClose={vi.fn()}
        collection={{
          ...SAGA,
          isSmart: true,
          isMine: true,
          owner: { profileId: 'me', name: 'Me', colour: '#fff' },
          rules: { holds: 'films', rules: [], order: 'added', limit: null },
        }}
      />,
    );

    await userEvent.click(
      screen.getByRole('switch', { name: 'Share it with everyone on this server' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(collections.updateCollection).toHaveBeenCalledWith(
        SAGA.id,
        expect.objectContaining({
          isShared: true,
          rules: { holds: 'films', rules: [], order: 'added', limit: null },
        }),
      );
    });
  });
});

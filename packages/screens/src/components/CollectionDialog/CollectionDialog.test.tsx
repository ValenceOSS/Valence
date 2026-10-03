import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CollectionDialog } from './CollectionDialog';
import type { CollectionEntry } from '@ValenceContracts/schemas/Collection';

const held = vi.hoisted(() => ({ mayEdit: false }));

const collections = vi.hoisted(() => ({
  fetchCollections: vi.fn(),
  fetchCollection: vi.fn(),
  collectionArtworkUrl: vi.fn(() => null),
  createCollection: vi.fn(),
  updateCollection: vi.fn(),
  dropCollectionArtwork: vi.fn(),
  dropFromCollection: vi.fn(),
  moveInCollection: vi.fn(),
  removeCollection: vi.fn(),
  saveCollectionArtwork: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => collections);

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({
    may: (permission: string) => permission === 'library.edit' && held.mayEdit,
    mayAdminister: false,
    isLoading: false,
  }),
}));

const SAGA_ID = '00000000-0000-4000-8000-00000000c011';

/**
 * An entry of the collection, a film unless it is said to stand for a programme.
 *
 * @param at - Which one, which names it and its film.
 * @param title - What it is called.
 * @param year - When it came out.
 * @returns The entry.
 */
const anEntry = (at: number, title: string, year: number): CollectionEntry => ({
  id: `00000000-0000-4000-8000-00000000e00${at.toString()}`,
  position: at,
  addedAt: '2026-10-02T00:00:00.000Z',
  kind: 'film',
  media: {
    id: `00000000-0000-4000-8000-00000000f00${at.toString()}`,
    libraryId: '00000000-0000-4000-8000-0000000000f1',
    title,
    year,
    durationSeconds: 60,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'SDR',
    addedAt: '2026-10-02T00:00:00.000Z',
    hasPoster: false,
    hasBackdrop: false,
    hasLogo: false,
    seriesId: null,
  },
});

const ENTRIES = [anEntry(1, 'Return', 1983), anEntry(2, 'Hope', 1977), anEntry(3, 'Empire', 1980)];

const SAGA = {
  id: SAGA_ID,
  name: 'Saga',
  description: 'Three films',
  isOrdered: true,
  hasOwnArtwork: false,
  entryCount: 3,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

/**
 * The titles the collection shows, in the order it shows them.
 *
 * @returns The titles.
 */
const shownTitles = (): string[] =>
  within(screen.getByRole('list', { name: 'Saga' }))
    .getAllByRole('listitem')
    .map((item) => (/Return|Hope|Empire/.exec(item.textContent) ?? [''])[0]);

/**
 * Opens the collection.
 *
 * @returns What it was told.
 */
const opened = () => {
  const told = { onClose: vi.fn(), onPlay: vi.fn(), onInspect: vi.fn(), onOpenShow: vi.fn() };

  renderInAnAddress(<CollectionDialog collectionId={SAGA_ID} {...told} />);

  return told;
};

beforeEach(() => {
  held.mayEdit = false;

  for (const mock of Object.values(collections)) {
    mock.mockReset();
  }

  collections.collectionArtworkUrl.mockReturnValue(null);
  collections.fetchCollection.mockResolvedValue({ collection: SAGA, entries: ENTRIES });
  collections.dropFromCollection.mockResolvedValue(true);
  collections.moveInCollection.mockResolvedValue(true);
  collections.removeCollection.mockResolvedValue(true);
});

describe('CollectionDialog', () => {
  it('shows a collection whose order matters in its own order, and says so', async () => {
    opened();

    expect(await screen.findByRole('heading', { name: 'Saga' })).toBeInTheDocument();
    expect(screen.getByText('3 titles, in order')).toBeInTheDocument();
    expect(screen.getByText('Three films')).toBeInTheDocument();
    expect(shownTitles()).toEqual(['Return', 'Hope', 'Empire']);
  });

  it('lays it out by year or by name instead', async () => {
    opened();

    await userEvent.click(await screen.findByRole('button', { name: 'By year' }));

    expect(shownTitles()).toEqual(['Hope', 'Empire', 'Return']);

    await userEvent.click(screen.getByRole('button', { name: 'By name' }));

    expect(shownTitles()).toEqual(['Empire', 'Hope', 'Return']);
  });

  it('lays out a collection whose order does not matter by year, with no order of its own offered', async () => {
    collections.fetchCollection.mockResolvedValue({
      collection: { ...SAGA, isOrdered: false },
      entries: ENTRIES,
    });

    opened();

    await screen.findByRole('heading', { name: 'Saga' });

    expect(shownTitles()).toEqual(['Hope', 'Empire', 'Return']);
    expect(screen.queryByRole('button', { name: 'Custom order' })).not.toBeInTheDocument();
  });

  it('offers nobody who may not edit the libraries a way to change it', async () => {
    opened();

    await screen.findByRole('heading', { name: 'Saga' });

    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Select artwork')).not.toBeInTheDocument();
  });

  it('takes a title out, and moves one earlier', async () => {
    held.mayEdit = true;
    opened();

    await screen.findByRole('heading', { name: 'Saga' });

    const [, second] = within(screen.getByRole('list', { name: 'Saga' })).getAllByRole('listitem');

    await userEvent.click(within(second ?? document.body).getByRole('button', { name: /Earlier/ }));
    await userEvent.click(within(second ?? document.body).getByRole('button', { name: /Remove/ }));

    expect(collections.moveInCollection).toHaveBeenCalledWith(SAGA_ID, ENTRIES[1]?.id, null);
    expect(collections.dropFromCollection).toHaveBeenCalledWith(SAGA_ID, ENTRIES[1]?.id);
  });

  it('deletes the collection once asked twice', async () => {
    held.mayEdit = true;
    const { onClose } = opened();

    await userEvent.click(await screen.findByRole('button', { name: 'More for Saga' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete collection' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(collections.removeCollection).toHaveBeenCalledWith(SAGA_ID);
  });

  it('says when there is nothing in it yet', async () => {
    collections.fetchCollection.mockResolvedValue({
      collection: { ...SAGA, entryCount: 0 },
      entries: [],
    });

    opened();

    expect(await screen.findByText('Nothing in this collection yet')).toBeInTheDocument();
  });

  it('draws nothing while no collection has been opened', () => {
    const { container } = renderInAnAddress(
      <CollectionDialog
        collectionId={null}
        onClose={vi.fn()}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
        onOpenShow={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(collections.fetchCollection).not.toHaveBeenCalled();
  });
});

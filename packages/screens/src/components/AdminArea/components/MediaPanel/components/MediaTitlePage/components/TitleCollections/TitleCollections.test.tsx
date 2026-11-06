import { render as renderBare, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TitleCollections } from './TitleCollections';
import type { ReactElement } from 'react';

const { listing, reading, dropping } = vi.hoisted(() => ({
  listing: vi.fn(),
  reading: vi.fn(),
  dropping: vi.fn(),
}));

vi.mock('@ValenceClient/collections/fetchCollections', () => ({
  fetchCollections: listing,
  fetchCollection: reading,
  dropFromCollection: dropping,
  addToCollection: vi.fn(),
}));

const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const HEISTS = {
  id: '00000000-0000-4000-8000-0000000000c1',
  name: 'Heists',
  description: null,
  isOrdered: false,
  hasOwnArtwork: false,
  entryCount: 1,
  coverMediaIds: [],
  isSmart: false,
};

describe('TitleCollections', () => {
  it('names the collections a title is in, and takes it out of one', async () => {
    listing.mockResolvedValue([HEISTS]);
    reading.mockResolvedValue({
      collection: HEISTS,
      entries: [
        { id: 'entry-1', position: 0, addedAt: '', kind: 'movie', media: { id: 'film-1' } },
      ],
    });
    dropping.mockResolvedValue(true);
    const user = userEvent.setup();

    render(<TitleCollections subject={{ mediaItemId: 'film-1' }} name="Heat" />);

    expect(await screen.findByText('Heists')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Take it out of Heists' }));

    await waitFor(() => {
      expect(dropping).toHaveBeenCalledWith(HEISTS.id, 'entry-1');
    });
  });

  it('says where a title is in no collection', async () => {
    listing.mockResolvedValue([]);

    render(<TitleCollections subject={{ mediaItemId: 'film-1' }} name="Heat" />);

    expect(await screen.findByText('It isn’t in a collection yet.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleCollections.displayName).toBe('TitleCollections');
  });
});

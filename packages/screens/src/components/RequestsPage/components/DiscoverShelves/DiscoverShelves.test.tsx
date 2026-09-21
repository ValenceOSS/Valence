import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DiscoverShelves } from './DiscoverShelves';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type * as Askable from '@ValenceClient/requests/fetchAskable';

const fetchDiscover = vi.fn<typeof Askable.fetchDiscover>();

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchDiscover: () => fetchDiscover(),
}));

const ASKABLE = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

/**
 * A title on a shelf, with anything a test cares about changed.
 */
const aTitle = (overrides: Partial<CatalogueTitle> = {}): CatalogueTitle => ({
  kind: 'film',
  id: '438631',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: 'https://image/dune.jpg',
  standing: ASKABLE,
  ...overrides,
});

beforeEach(() => {
  fetchDiscover.mockReset().mockResolvedValue({
    shelves: [
      {
        id: 'trending-films',
        title: 'Trending films',
        titles: [aTitle()],
        browse: { kind: 'film', list: 'trending', studio: null },
      },
      {
        id: 'popular-albums',
        title: 'Popular albums',
        titles: [aTitle({ kind: 'album', id: 'deezer-7', title: 'Pylon', subtitle: 'Band' })],
        browse: null,
      },
    ],
    studios: [{ id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://image/disney.png' }],
  });
});

/**
 * Draws the shelves, answering for what they lead to.
 */
const draw = () => {
  const handlers = { onAsk: vi.fn(), onBrowse: vi.fn(), onBrowseStudio: vi.fn() };

  renderInAnAddress(<DiscoverShelves {...handlers} />);

  return handlers;
};

describe('DiscoverShelves', () => {
  it('shelves films, music and the studios, and opens what is chosen', async () => {
    const { onAsk, onBrowseStudio } = draw();

    expect(await screen.findByRole('region', { name: 'Trending films' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Popular albums' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Studios' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Dune/ }));

    expect(onAsk).toHaveBeenCalledWith('film:438631');

    await userEvent.click(screen.getByRole('button', { name: 'Walt Disney Pictures' }));

    expect(onBrowseStudio).toHaveBeenCalledWith('2');
  });

  it('leaves the books to their own tab, rather than shelving them among the films', async () => {
    fetchDiscover.mockResolvedValue({
      shelves: [
        {
          id: 'trending-films',
          title: 'Trending films',
          titles: [aTitle()],
          browse: null,
        },
        {
          id: 'trending-books',
          title: 'Trending books',
          titles: [aTitle({ kind: 'book', id: '5', title: 'Emma', subtitle: 'Jane Austen' })],
          browse: null,
        },
      ],
      studios: [],
    });

    draw();

    expect(await screen.findByRole('region', { name: 'Trending films' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Trending books' })).not.toBeInTheDocument();
    expect(screen.queryByText('Emma')).not.toBeInTheDocument();
  });

  it('ends a shelf with the card that opens the whole list it came from', async () => {
    const { onBrowse } = draw();

    await userEvent.click(await screen.findByRole('button', { name: 'See all of trending films' }));

    expect(onBrowse).toHaveBeenCalledWith({ kind: 'film', list: 'trending', studio: null });
  });

  it('says so where nothing could be read', async () => {
    fetchDiscover.mockRejectedValue(new Error('The catalogue is not answering.'));

    draw();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

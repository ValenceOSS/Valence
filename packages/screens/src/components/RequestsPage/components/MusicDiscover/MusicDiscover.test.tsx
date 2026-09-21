import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { MusicDiscover } from './MusicDiscover';
import type { CatalogueDiscovery } from '@ValenceContracts/schemas/CatalogueTitle';

const discovery = vi.hoisted((): { current: CatalogueDiscovery } => ({
  current: { shelves: [], studios: [] },
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchDiscover: () => Promise.resolve(discovery.current),
}));

const standing = { status: 'askable', mediaId: null, requestId: null, requestState: null } as const;

beforeEach(() => {
  discovery.current = {
    studios: [],
    shelves: [
      {
        id: 'trending-films',
        title: 'Trending films',
        browse: null,
        titles: [
          {
            kind: 'film',
            id: '1',
            title: 'Dune',
            subtitle: null,
            year: 2021,
            overview: null,
            posterUrl: null,
            standing,
          },
        ],
      },
      {
        id: 'popular-albums',
        title: 'Popular albums',
        browse: null,
        titles: [
          {
            kind: 'album',
            id: 'deezer-7',
            title: 'Pylon',
            subtitle: 'Band',
            year: null,
            overview: null,
            posterUrl: null,
            standing,
          },
        ],
      },
    ],
  };
});

describe('MusicDiscover', () => {
  it('lays each music chart out under its heading, and leaves the films to their own tab', async () => {
    renderInAnAddress(<MusicDiscover onAsk={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Popular albums' })).toBeInTheDocument();
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();
  });

  it('opens what is chosen for asking', async () => {
    const onAsk = vi.fn();

    renderInAnAddress(<MusicDiscover onAsk={onAsk} />);

    await userEvent.setup().click(await screen.findByRole('button', { name: /Pylon/ }));

    expect(onAsk).toHaveBeenCalledWith('album:deezer-7');
  });

  it('says so where no chart could be read', async () => {
    discovery.current = { shelves: [], studios: [] };

    renderInAnAddress(<MusicDiscover onAsk={vi.fn()} />);

    expect(await screen.findByText('No music to ask for')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicDiscover.displayName).toBe('MusicDiscover');
  });
});

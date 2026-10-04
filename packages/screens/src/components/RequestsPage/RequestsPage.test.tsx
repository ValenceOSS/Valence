import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { RequestsPage } from './RequestsPage';
import type { CatalogueGridProps } from './components/CatalogueGrid/CatalogueGrid.types';

const drawn = vi.hoisted((): { browsing: CatalogueGridProps['browsing'] | null } => ({
  browsing: null,
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchDiscover: () =>
    Promise.resolve({
      shelves: [],
      studios: [
        {
          id: '2',
          name: 'Walt Disney Pictures',
          logoUrl: 'https://image/disney.png',
          lightLogoUrl: 'https://image/disney-light.png',
        },
      ],
    }),
}));

vi.mock('./components/CatalogueGrid/CatalogueGrid', () => ({
  CatalogueGrid: ({ browsing }: CatalogueGridProps) => {
    drawn.browsing = browsing;

    return <p>a grid</p>;
  },
}));

vi.mock('./components/RequestsList/RequestsList', () => ({
  RequestsList: () => <p>your requests</p>,
}));

beforeEach(() => {
  drawn.browsing = null;
  window.history.replaceState(null, '', '/requests');
});

describe('RequestsPage', () => {
  it('opens on Discover, with no row of tabs of its own — the bar chooses the view', async () => {
    renderInAShell(<RequestsPage />);

    expect(await screen.findByRole('button', { name: 'Walt Disney Pictures' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('shows the whole list the address names', async () => {
    window.history.replaceState(null, '', '/requests?view=film%3Apopular');

    renderInAShell(<RequestsPage />);

    expect(await screen.findByText('a grid')).toBeInTheDocument();
    expect(drawn.browsing).toEqual({ kind: 'film', list: 'popular', studio: null });
  });

  it('heads a whole list with what it is', async () => {
    window.history.replaceState(null, '', '/requests?view=series:trending');

    renderInAShell(<RequestsPage />);

    expect(await screen.findByRole('heading', { name: 'Trending series' })).toBeInTheDocument();
  });

  it('names the studio whose films are showing', async () => {
    window.history.replaceState(null, '', '/requests?view=film:popular:2');

    renderInAShell(<RequestsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Walt Disney Pictures films' }),
    ).toBeInTheDocument();
  });

  it('shows music to ask for where the address asks for it', async () => {
    window.history.replaceState(null, '', '/requests?view=music');

    renderInAShell(<RequestsPage />);

    expect(
      await screen.findByRole('status', { name: 'Loading music to request' }),
    ).toBeInTheDocument();
  });

  it('shows books to ask for where the address asks for them', async () => {
    window.history.replaceState(null, '', '/requests?view=books');

    renderInAShell(<RequestsPage />);

    expect(await screen.findByRole('textbox', { name: 'Search for a book' })).toBeInTheDocument();
  });

  it('shows your own requests where the address asks for them', async () => {
    window.history.replaceState(null, '', '/requests?view=mine');

    renderInAShell(<RequestsPage />);

    expect(await screen.findByText('your requests')).toBeInTheDocument();
  });
});

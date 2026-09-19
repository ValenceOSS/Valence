import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      studios: [{ id: '2', name: 'Walt Disney Pictures', logoUrl: 'https://image/disney.png' }],
    }),
}));

vi.mock('./components/CatalogueGrid/CatalogueGrid', () => ({
  CatalogueGrid: ({ browsing }: CatalogueGridProps) => {
    drawn.browsing = browsing;

    return <p>a grid</p>;
  },
}));

vi.mock('./components/MyRequests/MyRequests', () => ({
  MyRequests: () => <p>your requests</p>,
}));

beforeEach(() => {
  drawn.browsing = null;
  window.history.replaceState(null, '', '/requests');
});

describe('RequestsPage', () => {
  it('opens on Discover, and keeps which side is showing in the address', async () => {
    renderInAShell(<RequestsPage />);

    expect(screen.getByRole('tab', { name: 'Discover' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(screen.getByRole('tab', { name: 'Movies' }));

    await vi.waitFor(() => {
      expect(window.location.search).toContain('view=film%3Apopular');
    });
    expect(drawn.browsing).toEqual({ kind: 'film', list: 'popular', studio: null });
  });

  it('shows a whole list the address names, under the tab it belongs to', async () => {
    window.history.replaceState(null, '', '/requests?view=series:trending');

    renderInAShell(<RequestsPage />);

    expect(await screen.findByRole('heading', { name: 'Trending series' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Shows' })).toHaveAttribute('aria-selected', 'true');
  });

  it('names the studio whose films are showing', async () => {
    window.history.replaceState(null, '', '/requests?view=film:popular:2');

    renderInAShell(<RequestsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Walt Disney Pictures films' }),
    ).toBeInTheDocument();
  });

  it('shows your own requests where the address asks for them', () => {
    window.history.replaceState(null, '', '/requests?view=mine');

    renderInAShell(<RequestsPage />);

    expect(screen.getByText('your requests')).toBeInTheDocument();
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CatalogueBrowser } from './CatalogueBrowser';
import type * as Askable from '@ValenceClient/requests/fetchAskable';

const fetchCatalogueBrowse = vi.fn<typeof Askable.fetchCatalogueBrowse>();
const fetchCatalogueGenres = vi.fn<typeof Askable.fetchCatalogueGenres>();

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchCatalogueBrowse: (...given: Parameters<typeof Askable.fetchCatalogueBrowse>) =>
    fetchCatalogueBrowse(...given),
  fetchCatalogueGenres: (...given: Parameters<typeof Askable.fetchCatalogueGenres>) =>
    fetchCatalogueGenres(...given),
}));

vi.mock('@ValenceUI/useHasScrolledPast', () => ({
  useHasScrolledPast: () => ({ mark: () => undefined, hasPassed: true }),
}));

const BROWSING = { kind: 'film', list: 'popular', studio: null } as const;

beforeEach(() => {
  fetchCatalogueBrowse.mockReset().mockResolvedValue({ titles: [], page: 1, hasMore: false });
  fetchCatalogueGenres.mockReset().mockResolvedValue([
    { id: '28', name: 'Action' },
    { id: '878', name: 'Science Fiction' },
  ]);
});

describe('CatalogueBrowser', () => {
  it('offers to filter films by genre, decade and rating', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(<CatalogueBrowser browsing={BROWSING} onAsk={vi.fn()} />);

    await actor.click(await screen.findByRole('button', { name: /Filter films/ }));

    expect(await screen.findByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Decade')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(fetchCatalogueGenres).toHaveBeenCalledWith('film');
  });

  it('asks the catalogue for what was chosen, and shows it as a chip that can be removed', async () => {
    const actor = userEvent.setup();

    renderInAnAddress(<CatalogueBrowser browsing={BROWSING} onAsk={vi.fn()} />);

    await actor.click(await screen.findByRole('button', { name: /Filter films/ }));
    await actor.click(await screen.findByRole('checkbox', { name: 'Science Fiction' }));

    await waitFor(() => {
      expect(fetchCatalogueBrowse).toHaveBeenLastCalledWith(BROWSING, 1, { genre: '878' });
    });

    expect(screen.getByRole('button', { name: /Remove.*Science Fiction/ })).toBeInTheDocument();
  });

  it('asks for the series genres on a page of series', async () => {
    renderInAnAddress(
      <CatalogueBrowser
        browsing={{ kind: 'series', list: 'popular', studio: null }}
        onAsk={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(fetchCatalogueGenres).toHaveBeenCalledWith('series');
    });

    expect(await screen.findByRole('button', { name: /Filter series/ })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CatalogueBrowser.displayName).toBe('CatalogueBrowser');
  });
});

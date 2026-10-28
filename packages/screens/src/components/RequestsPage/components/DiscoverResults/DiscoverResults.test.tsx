import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DiscoverResults } from './DiscoverResults';
import type { DiscoverFound } from '@ValenceClient/requests/useDiscoverSearch';

const found = vi.hoisted((): { now: DiscoverFound | null } => ({ now: null }));

vi.mock('@ValenceClient/requests/useDiscoverSearch', () => ({
  useDiscoverSearch: () => found.now,
}));

const server = vi.hoisted((): { readsOn: boolean | null } => ({ readsOn: null }));

vi.mock('@ValenceClient/about/useServerHas', () => ({
  useServerHas: (feature: string) => (feature === 'requests.searchPages' ? server.readsOn : null),
}));

const NOTHING: DiscoverFound = {
  films: [],
  shows: [],
  artists: [],
  books: [],
  count: 0,
  isPending: false,
  problem: null,
};

beforeEach(() => {
  found.now = NOTHING;
  server.readsOn = null;
});

describe('DiscoverResults', () => {
  it('lists what the catalogues have by kind, and opens what is chosen', async () => {
    const onAsk = vi.fn();

    found.now = {
      ...NOTHING,
      films: [aCatalogueTitle({ title: 'Dune', id: '438631' })],
      books: [aCatalogueTitle({ kind: 'book', title: 'Dune Messiah', id: '27448' })],
      count: 2,
    };

    renderInAnAddress(<DiscoverResults query="dune" onAsk={onAsk} />);

    expect(screen.getByRole('heading', { name: 'Movies' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Books' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Shows' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Dune2021/ }));

    expect(onAsk).toHaveBeenCalledWith('film:438631');
  });

  it('opens everything found of films or of shows, where the server reads past a rail', async () => {
    const onSeeAll = vi.fn();

    server.readsOn = true;
    found.now = {
      ...NOTHING,
      films: [aCatalogueTitle({ title: 'Dune', id: '438631' })],
      shows: [aCatalogueTitle({ kind: 'series', title: 'Dune: Prophecy', id: '90228' })],
      count: 2,
    };

    renderInAnAddress(<DiscoverResults query="dune" onAsk={vi.fn()} onSeeAll={onSeeAll} />);

    await userEvent.click(screen.getByRole('button', { name: 'See all of movies' }));
    await userEvent.click(screen.getByRole('button', { name: 'See all of shows' }));

    expect(onSeeAll).toHaveBeenNthCalledWith(1, { kind: 'film', query: 'dune' });
    expect(onSeeAll).toHaveBeenNthCalledWith(2, { kind: 'series', query: 'dune' });
  });

  it('offers no more than the rail where the server cannot read past it', () => {
    server.readsOn = false;
    found.now = {
      ...NOTHING,
      films: [aCatalogueTitle({ title: 'Dune', id: '438631' })],
      count: 1,
    };

    renderInAnAddress(<DiscoverResults query="dune" onAsk={vi.fn()} onSeeAll={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'See all of movies' })).not.toBeInTheDocument();
  });

  it('says so where the catalogues have nothing', () => {
    renderInAnAddress(<DiscoverResults query="zzz" onAsk={vi.fn()} />);

    expect(screen.getByText('Nothing in the catalogues matches “zzz”.')).toBeInTheDocument();
  });

  it('says why the catalogues could not be searched, rather than that they have nothing', () => {
    found.now = { ...NOTHING, problem: 'Couldn’t reach TMDB.' };

    renderInAnAddress(<DiscoverResults query="zzz" onAsk={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t reach TMDB.');
    expect(screen.queryByText('Nothing in the catalogues matches “zzz”.')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscoverResults.displayName).toBe('DiscoverResults');
  });
});

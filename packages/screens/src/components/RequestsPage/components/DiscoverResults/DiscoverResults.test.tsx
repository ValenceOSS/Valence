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

const NOTHING: DiscoverFound = {
  films: [],
  shows: [],
  artists: [],
  books: [],
  count: 0,
  isPending: false,
};

beforeEach(() => {
  found.now = NOTHING;
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

  it('says so where the catalogues have nothing', () => {
    renderInAnAddress(<DiscoverResults query="zzz" onAsk={vi.fn()} />);

    expect(screen.getByText('Nothing in the catalogues matches “zzz”.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscoverResults.displayName).toBe('DiscoverResults');
  });
});

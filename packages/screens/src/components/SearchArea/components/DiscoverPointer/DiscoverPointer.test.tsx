import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { DiscoverPointer } from './DiscoverPointer';
import type { DiscoverFound } from '@ValenceClient/requests/useDiscoverSearch';

const found = vi.hoisted((): { now: DiscoverFound | null } => ({ now: null }));

vi.mock('@ValenceClient/requests/useDiscoverSearch', () => ({
  useDiscoverSearch: () => found.now,
}));

const DUNE = aCatalogueTitle({ title: 'Dune', id: '438631', posterUrl: '/dune.jpg' });

beforeEach(() => {
  found.now = { films: [DUNE], shows: [], artists: [], books: [], count: 1, isPending: false };
});

describe('DiscoverPointer', () => {
  it('points from library results to what Discover has, and opens Discover', async () => {
    const onDiscover = vi.fn();

    render(
      <DiscoverPointer query="dune" isAlone={false} onAsk={vi.fn()} onDiscover={onDiscover} />,
    );

    expect(screen.getByText('Can’t find what you’re looking for?')).toBeInTheDocument();
    expect(
      screen.getByText('Discover has 1 result for “dune” that you can request.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Search Discover for “dune”' }));

    expect(onDiscover).toHaveBeenCalledWith('dune');
  });

  it('says so where the library found nothing, and opens a title from its poster', async () => {
    const onAsk = vi.fn();

    render(<DiscoverPointer query="dune" isAlone onAsk={onAsk} onDiscover={vi.fn()} />);

    expect(screen.getByText('Nothing on this server matches “dune”')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'See 1 result in Discover' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film:438631');
  });

  it('shows nothing where Discover has nothing either', () => {
    found.now = { films: [], shows: [], artists: [], books: [], count: 0, isPending: false };

    const { container } = render(
      <DiscoverPointer query="zzz" isAlone onAsk={vi.fn()} onDiscover={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DiscoverPointer.displayName).toBe('DiscoverPointer');
  });
});

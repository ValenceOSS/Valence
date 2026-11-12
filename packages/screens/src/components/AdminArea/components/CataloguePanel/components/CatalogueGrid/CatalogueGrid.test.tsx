import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { CatalogueGrid } from './CatalogueGrid';
import type * as Grid from '@ValenceUI/VirtualGrid';

const askedFor: number[] = [];

vi.mock('@ValenceUI/VirtualGrid', async (original) => {
  const { VirtualGrid } = await original<typeof Grid>();

  return {
    VirtualGrid: (props: Parameters<typeof VirtualGrid>[0]) => {
      askedFor.push(props.leastCardWidth);

      return <VirtualGrid {...props} />;
    },
  };
});

/**
 * A window as wide as asked: a phone, or one with room.
 */
const aWindow = (hasRoom: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: hasRoom,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
};

afterEach(() => {
  vi.unstubAllGlobals();
  askedFor.length = 0;
});

const FILM = aCatalogueEntry({ key: 'film:1', title: 'Held Film' });
const ASKED = aCatalogueEntry({
  key: 'film:2',
  title: 'Asked Film',
  status: 'toApprove',
  requestId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  art: null,
});

/**
 * The grid of two titles, not choosing.
 */
const aGrid = (overrides: Partial<Parameters<typeof CatalogueGrid>[0]> = {}) => {
  const props = {
    entries: [FILM, ASKED],
    size: 'medium' as const,
    isSquare: false,
    isChoosing: false,
    chosen: new Set<string>(),
    onChoose: vi.fn(),
    onOpen: vi.fn(),
    ...overrides,
  };

  render(<CatalogueGrid {...props} />);

  return props;
};

describe('CatalogueGrid', () => {
  it('lets cards be narrower on a phone, so two fit across rather than one', () => {
    aWindow(false);
    aGrid();

    expect(askedFor.at(-1)).toBe(130);
  });

  it('keeps the library pages’ card width where there is room', () => {
    aWindow(true);
    aGrid();

    expect(askedFor.at(-1)).toBe(170);
  });

  it('badges each title with where it stands, leaves one nobody follows bare, and opens one', async () => {
    const { onOpen } = aGrid();

    expect(screen.getByText('To approve')).toBeInTheDocument();
    expect(screen.queryByText('Not followed')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Held Film/ }));

    expect(onOpen).toHaveBeenCalledWith(FILM);
  });

  it('draws a bar along the foot only while a title is part of the way here', () => {
    aGrid({
      entries: [
        aCatalogueEntry({
          key: 'series:1',
          title: 'Arriving',
          status: 'downloading',
          held: 3,
          total: 10,
        }),
        aCatalogueEntry({ key: 'film:3', title: 'Here', status: 'library', held: 1, total: 1 }),
      ],
    });

    expect(screen.getByText(/3 of 10/)).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /3 of 10/ })).toHaveLength(1);
    expect(screen.queryByRole('img', { name: /In library|Here/ })).not.toBeInTheDocument();
  });

  it('ticks a title waiting on approval while choosing, and only those', async () => {
    const { onChoose, onOpen } = aGrid({ isChoosing: true });

    expect(screen.queryByRole('checkbox', { name: /Held Film/ })).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox', { name: /Asked Film/ }));
    await userEvent.setup().click(screen.getByRole('button', { name: /Asked Film/ }));

    expect(onChoose).toHaveBeenCalledWith('film:2', true);
    expect(onChoose).toHaveBeenCalledTimes(2);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CatalogueGrid.displayName).toBe('CatalogueGrid');
  });
});

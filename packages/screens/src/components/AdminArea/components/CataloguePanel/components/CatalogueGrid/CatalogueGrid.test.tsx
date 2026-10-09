import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { CatalogueGrid } from './CatalogueGrid';

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
  it('draws each title with a bar saying where it stands, and opens one', async () => {
    const { onOpen } = aGrid();

    expect(screen.getByRole('img', { name: 'Not followed' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'To approve' })).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: /Held Film/ }));

    expect(onOpen).toHaveBeenCalledWith(FILM);
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

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShelfTable } from './ShelfTable';
import type { ShelfItem } from '@ValenceScreens/components/AdminArea/components/MediaPanel/ShelfItem.types';

const album = (overrides: Partial<ShelfItem> = {}): ShelfItem => ({
  id: 'album-1',
  name: 'Blue',
  year: 1971,
  detail: 'Joni Mitchell · 10 tracks',
  cover: '/api/music/albums/album-1/artwork',
  isSquare: true,
  sizeBytes: 300_000_000,
  addedAt: '2026-09-21T00:00:00.000Z',
  onCorrect: null,
  place: null,
  ...overrides,
});

describe('ShelfTable', () => {
  it('lists each thing with its cover, year and a line about it', () => {
    render(<ShelfTable label="Music" items={[album()]} toolbar={null} emptyMessage="None." />);

    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('1971')).toBeInTheDocument();
    expect(screen.getByText('Joni Mitchell · 10 tracks')).toBeInTheDocument();
  });

  it('corrects a match from its menu, and offers no menu where nothing can be corrected', async () => {
    const onCorrect = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <ShelfTable label="Music" items={[album()]} toolbar={null} emptyMessage="None." />,
    );

    expect(screen.queryByRole('button', { name: 'Actions for Blue' })).not.toBeInTheDocument();

    rerender(
      <ShelfTable
        label="Music"
        items={[album({ onCorrect })]}
        toolbar={null}
        emptyMessage="None."
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions for Blue' }));
    await user.click(screen.getByRole('menuitem', { name: /Wrong match/ }));

    expect(onCorrect).toHaveBeenCalled();
  });

  it('shows where each thing is, and opens its folder in Files', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    render(
      <ShelfTable
        label="Music"
        items={[
          album({
            place: { shown: 'Joni Mitchell/Blue', folder: '/media/music/Joni Mitchell/Blue' },
          }),
        ]}
        toolbar={null}
        emptyMessage="None."
        onOpenFolder={onOpenFolder}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Open /media/music/Joni Mitchell/Blue in Files' }),
    );

    expect(onOpenFolder).toHaveBeenCalledWith('/media/music/Joni Mitchell/Blue');
  });

  it('says so when there is nothing on the shelf', () => {
    render(<ShelfTable label="Music" items={[]} toolbar={null} emptyMessage="Nothing yet." />);

    expect(screen.getByText('Nothing yet.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ShelfTable.displayName).toBe('ShelfTable');
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { describe, expect, it, vi } from 'vitest';
import { columnsIn } from '@ValenceUI/columnsIn';
import { MediaGrid } from './MediaGrid';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const item = (id: string, title: string): MediaSummary => ({
  id,
  libraryId: 'library-1',
  title,
  year: 2016,
  durationSeconds: 7200,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
});

const items = [item('a', 'Arrival'), item('b', 'Dune')];

describe('MediaGrid', () => {
  it('draws every item it is given', () => {
    renderInAnAddress(<MediaGrid items={items} onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Arrival/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dune/ })).toBeInTheDocument();
  });

  it('draws nothing at all when there is nothing to draw', () => {
    renderInAnAddress(<MediaGrid items={[]} onPlay={vi.fn()} onInspect={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says how far through each item this viewer is', () => {
    const { container } = renderInAnAddress(
      <MediaGrid
        items={items}
        onPlay={vi.fn()}
        onInspect={vi.fn()}
        watchedFractionFor={(mediaId) => (mediaId === 'a' ? 0.5 : undefined)}
      />,
    );

    expect(container.querySelector('[style*="50%"]')).not.toBeNull();
  });

  it('opens the programme, not the episode, for the cards a caller says stand for programmes', async () => {
    const onInspect = vi.fn();
    const onOpenShow = vi.fn();
    const episode = { ...item('e1', 'Pilot'), seriesId: 'ted', seriesTitle: 'Ted Lasso' };

    renderInAnAddress(
      <MediaGrid
        items={[episode, item('a', 'Arrival')]}
        isSeries={(media) => media.seriesTitle !== null && media.seriesTitle !== undefined}
        onOpenShow={onOpenShow}
        onPlay={vi.fn()}
        onInspect={onInspect}
      />,
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Ted Lasso/ }));
    await user.click(screen.getByRole('button', { name: /Arrival/ }));

    expect(onOpenShow).toHaveBeenCalledWith(episode);
    expect(onInspect).toHaveBeenCalledTimes(1);
    expect(onInspect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arrival' }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaGrid.displayName).toBe('MediaGrid');
  });

  it('fits more cards across at a smaller size than at a larger one', () => {
    const { container } = renderInAnAddress(
      <MediaGrid items={items} size="small" onPlay={vi.fn()} onInspect={vi.fn()} />,
    );
    const small = container.querySelector('[style*="grid-template-columns"]');

    expect(small).not.toBeNull();
    expect(columnsIn(1200, 220, 16)).toBeGreaterThan(columnsIn(1200, 420, 16));
  });
});

describe('a grid of posters', () => {
  it('stands its cards upright on their posters', () => {
    const { container } = renderInAnAddress(
      <MediaGrid items={items} size="small" shape="poster" onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    expect(container.querySelectorAll('.aspect-\\[2\\/3\\]')).toHaveLength(2);
    expect(columnsIn(1200, 130, 16)).toBeGreaterThan(columnsIn(1200, 220, 16));
  });

  it('lays its cards flat unless asked otherwise', () => {
    const { container } = renderInAnAddress(
      <MediaGrid items={items} size="small" onPlay={vi.fn()} onInspect={vi.fn()} />,
    );

    expect(container.querySelectorAll('.aspect-video')).toHaveLength(2);
  });
});

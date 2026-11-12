import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LibraryRail } from './LibraryRail';
import type { LibraryRailProps } from './LibraryRail.types';

const ARRIVAL = aMediaSummary();

const ALIEN = aMediaSummary({ id: '00000000-0000-4000-8000-0000000000f2', title: 'Alien' });

/**
 * Draws a rail of two films, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns What the rail was drawn with.
 */
const draw = (change: Partial<LibraryRailProps> = {}) => {
  const props: LibraryRailProps = {
    rail: { id: 'genre:Drama', title: 'Drama', items: [ARRIVAL, ALIEN] },
    isHome: false,
    progress: new Map(),
    flagOf: () => 'New',
    onPlayFilm: vi.fn(),
    onPlayShow: vi.fn(),
    onInspect: vi.fn(),
    ...change,
  };

  renderInAnAddress(<LibraryRail {...props} />);

  return props;
};

describe('LibraryRail', () => {
  it('draws a row named for the rail, with a card for each of its titles', () => {
    draw();

    const row = screen.getByRole('region', { name: 'Drama' });

    expect(within(row).getByRole('button', { name: /Arrival/ })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /Alien/ })).toBeInTheDocument();
  });

  it('flags what is new only on the front page', () => {
    draw({ isHome: true });

    expect(screen.getByRole('button', { name: 'Arrival, New' })).toBeInTheDocument();
  });

  it('flags nothing on a page that is not the front one', () => {
    draw();

    expect(screen.queryByRole('button', { name: /, New$/ })).not.toBeInTheDocument();
  });

  it('opens the programme a rail is about from its title', async () => {
    const show = aMediaSummary({ seriesId: 'a-show', seriesTitle: 'Severance' });
    const { onOpenShow } = draw({
      rail: { id: 'show', title: 'Severance', items: [ARRIVAL], showOf: show },
      onOpenShow: vi.fn(),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Severance' }));

    expect(onOpenShow).toHaveBeenCalledWith(show);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LibraryRail.displayName).toBe('LibraryRail');
  });
});

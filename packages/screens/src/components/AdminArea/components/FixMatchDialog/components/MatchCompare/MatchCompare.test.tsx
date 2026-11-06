import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MatchCompare } from './MatchCompare';
import type { MatchPreview } from '@ValenceContracts/schemas/TitleEdit';

const PREVIEW: MatchPreview = {
  kind: 'film',
  posterUrl: null,
  backdropUrl: null,
  rows: [
    { field: 'title', current: { value: 'Old', source: 'catalogue' }, next: 'New' },
    { field: 'tagline', current: { value: 'Mine', source: 'locked' }, next: 'Theirs' },
    { field: 'genres', current: { value: ['Drama'], source: 'catalogue' }, next: ['Drama'] },
  ],
};

describe('MatchCompare', () => {
  it('lists the fields that would change, with their badge, and ticks one on asking', async () => {
    const onTake = vi.fn();

    render(
      <MatchCompare mediaId="a" preview={PREVIEW} taken={new Set(['title'])} onTake={onTake} />,
    );

    expect(screen.getByText('Old')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.queryByText('Genres')).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('checkbox', { name: 'Take the new Tagline' }));

    expect(onTake).toHaveBeenCalledWith('tagline', true);
  });

  it('says when nothing but the match would change', () => {
    render(
      <MatchCompare
        mediaId="a"
        preview={{ ...PREVIEW, rows: PREVIEW.rows.slice(2) }}
        taken={new Set()}
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText('Nothing would change but the match.')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MatchCompare.displayName).toBe('MatchCompare');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MatchReview } from './MatchReview';

const { searching, correcting } = vi.hoisted(() => ({
  searching: vi.fn((query: string) =>
    Promise.resolve({
      matches: [
        {
          externalId: `${query}-far`,
          kind: 'movie',
          title: 'Far Off',
          year: 1990,
          overview: null,
          posterUrl: null,
        },
        {
          externalId: `${query}-near`,
          kind: 'movie',
          title: query,
          year: 2001,
          overview: null,
          posterUrl: null,
        },
      ],
      hasMore: false,
      total: 2,
    }),
  ),
  correcting: vi.fn(() => Promise.resolve({ corrected: 1, jobId: null })),
}));

vi.mock('@ValenceClient/admin/fetchTitleCandidates', () => ({ fetchTitleCandidates: searching }));
vi.mock('@ValenceClient/library/fetchLibrary', () => ({ correctMatch: correcting }));

const TITLES = [
  { mediaId: 'a', name: 'One', year: 2001, kind: 'movie' as const },
  { mediaId: 'b', name: 'Two', year: 2001, kind: 'movie' as const },
  { mediaId: 'c', name: 'Three', year: 2001, kind: 'movie' as const },
];

describe('MatchReview', () => {
  it('goes back and forth, then matches the rest to their best fits', async () => {
    const onMatched = vi.fn();
    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<MatchReview titles={TITLES} onMatched={onMatched} onDone={onDone} />);

    expect(await screen.findByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Skip' }));
    await user.click(screen.getByRole('button', { name: 'Accept the best fit for the rest' }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
    expect(correcting.mock.calls).toEqual([
      ['b', 'Two-near', 'movie'],
      ['c', 'Three-near', 'movie'],
    ]);
    expect(onMatched).toHaveBeenCalledWith('b', 'Two (2001)');
  });
});

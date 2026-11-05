import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuickMatchDialog } from './QuickMatchDialog';

const { searching, correcting } = vi.hoisted(() => ({
  searching: vi.fn((query: string) =>
    Promise.resolve({
      matches:
        query === 'Clear One'
          ? [
              {
                externalId: '1',
                kind: 'movie',
                title: 'Clear One',
                year: 2001,
                overview: null,
                posterUrl: null,
              },
            ]
          : [
              {
                externalId: '2',
                kind: 'movie',
                title: 'Twin',
                year: 2001,
                overview: null,
                posterUrl: null,
              },
              {
                externalId: '3',
                kind: 'movie',
                title: 'Twin',
                year: 2005,
                overview: null,
                posterUrl: null,
              },
            ],
      hasMore: false,
      total: 1,
    }),
  ),
  correcting: vi.fn(() => Promise.resolve({ corrected: 1, jobId: null })),
}));

vi.mock('@ValenceClient/admin/fetchTitleCandidates', () => ({ fetchTitleCandidates: searching }));
vi.mock('@ValenceClient/library/fetchLibrary', () => ({ correctMatch: correcting }));

describe('QuickMatchDialog', () => {
  it('matches only the title one entry clearly fits, and leaves the other with Fix match', async () => {
    const onFixMatch = vi.fn();
    const onMatched = vi.fn();
    const user = userEvent.setup();

    render(
      <QuickMatchDialog
        titles={[
          { mediaId: 'a', name: 'Clear One', year: 2001, kind: 'movie' },
          { mediaId: 'b', name: 'Twin', year: null, kind: 'movie' },
        ]}
        onClose={vi.fn()}
        onFixMatch={onFixMatch}
        onMatched={onMatched}
      />,
    );

    expect(correcting).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Match 2 titles' }));

    expect(await screen.findByText('Matched to Clear One (2001)')).toBeInTheDocument();
    await waitFor(() => {
      expect(onMatched).toHaveBeenCalled();
    });
    expect(correcting).toHaveBeenCalledTimes(1);
    expect(correcting).toHaveBeenCalledWith('a', '1', 'movie');
    expect(screen.getByText('Matched 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fix match for Twin' }));

    expect(onFixMatch).toHaveBeenCalledWith('b');
  });
});

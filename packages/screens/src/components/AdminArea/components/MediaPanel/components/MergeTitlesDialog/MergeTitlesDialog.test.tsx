import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MergeTitlesDialog } from './MergeTitlesDialog';

const { correcting } = vi.hoisted(() => ({
  correcting: vi.fn(() => Promise.resolve({ corrected: 1, jobId: null })),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ correctMatch: correcting }));

const FILMS = [
  { mediaId: 'a', name: 'One', year: 2001, externalId: '1' },
  { mediaId: 'b', name: 'One Extended', year: 2001, externalId: '2' },
  { mediaId: 'c', name: 'one.mkv', year: null, externalId: null },
];

describe('MergeTitlesDialog', () => {
  it('matches every other film to the one chosen, never choosing one that is not matched', async () => {
    const onMerged = vi.fn();
    const user = userEvent.setup();

    render(<MergeTitlesDialog films={FILMS} onClose={vi.fn()} onMerged={onMerged} />);

    expect(
      screen.getByRole('button', { name: /one\.mkv \(not matched\)|one\.mkv, not matched/u }),
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /One Extended/u }));
    await user.click(screen.getByRole('button', { name: 'Merge 3 films' }));

    await waitFor(() => {
      expect(onMerged).toHaveBeenCalled();
    });
    expect(correcting.mock.calls).toEqual([
      ['a', '2', 'movie'],
      ['c', '2', 'movie'],
    ]);
  });
});

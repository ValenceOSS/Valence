import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { RenameToPatternDialog } from './RenameToPatternDialog';

const { planning, renaming } = vi.hoisted(() => ({
  planning: vi.fn(() =>
    Promise.resolve({
      files: [
        {
          mediaId: 'a',
          from: '/shows/show/a.mkv',
          to: '/shows/show/A - S01E01.mkv',
          sidecars: 2,
          state: 'ready',
        },
        {
          mediaId: 'b',
          from: '/shows/show/b.mkv',
          to: '/shows/show/A - S01E02.mkv',
          sidecars: 0,
          state: 'taken',
        },
        { mediaId: 'c', from: '/shows/x.mkv', to: '/shows/x.mkv', sidecars: 0, state: 'unmatched' },
      ],
    }),
  ),
  renaming: vi.fn(() => Promise.resolve({ renamed: 1, skipped: 0, jobId: null })),
}));

vi.mock('@ValenceClient/admin/planPatternRenames', () => ({ planPatternRenames: planning }));
vi.mock('@ValenceClient/admin/renameToPattern', () => ({ renameToPattern: renaming }));

describe('RenameToPatternDialog', () => {
  it('shows each new name, says what is left, and renames only what stays ticked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CacheScope>
        <RenameToPatternDialog mediaIds={['a', 'b', 'c']} onClose={onClose} />
      </CacheScope>,
    );

    expect(await screen.findByText('a.mkv')).toBeVisible();
    expect(screen.getByText('With 2 files kept beside it')).toBeVisible();
    expect(screen.getByText('Name taken')).toBeVisible();
    expect(screen.getByText(/1 file isn’t matched to the catalogue/u)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Rename 1 file' })).toBeVisible();

    await user.click(screen.getByRole('checkbox', { name: 'A - S01E01.mkv' }));

    expect(screen.queryByRole('button', { name: /Rename \d/u })).toBeNull();

    await user.click(screen.getByRole('checkbox', { name: 'Every file below' }));
    await user.click(screen.getByRole('button', { name: 'Rename 1 file' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(renaming).toHaveBeenCalledWith(['a'], 'skip');
  });
});

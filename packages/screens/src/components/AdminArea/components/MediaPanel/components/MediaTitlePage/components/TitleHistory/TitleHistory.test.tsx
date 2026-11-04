import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TitleHistory } from './TitleHistory';

const { history, undo } = vi.hoisted(() => ({ history: vi.fn(), undo: vi.fn() }));

vi.mock('@ValenceClient/admin/fetchTitleMetadata', () => ({
  fetchTitleHistory: history,
  undoTitleChange: undo,
  editTitleMetadata: vi.fn(),
  fetchTitleMetadata: vi.fn(),
}));
vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

describe('TitleHistory', () => {
  it('lists each change with who made it and what each field went from and to, and undoes one', async () => {
    const user = userEvent.setup();

    history.mockResolvedValue({
      changes: [
        {
          changeSetId: 'set',
          at: '2026-11-04T12:00:00.000Z',
          by: 'Ada',
          action: 'set',
          fields: [{ field: 'title', before: 'A film', after: 'Mine' }],
        },
      ],
    });
    undo.mockResolvedValue({ kind: 'refused', reason: 'Changed since' });

    render(<TitleHistory mediaId="a" scope="title" kind="film" />, { wrapper: CacheScope });

    expect(await screen.findByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Title: A film → Mine')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for Edited' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Undo' }));

    expect(undo).toHaveBeenCalledWith('a', 'title', 'set');
  });

  it('says when nothing has changed yet', async () => {
    history.mockResolvedValue({ changes: [] });

    render(<TitleHistory mediaId="a" scope="title" kind="film" />, { wrapper: CacheScope });

    expect(
      await screen.findByText('Nothing has been changed on this title yet.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleHistory.displayName).toBe('TitleHistory');
  });
});

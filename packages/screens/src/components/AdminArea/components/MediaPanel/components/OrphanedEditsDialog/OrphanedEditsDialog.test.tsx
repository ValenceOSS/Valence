import { render as renderBare, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { OrphanedEditsDialog } from './OrphanedEditsDialog';
import type { ReactElement } from 'react';

const server = vi.hoisted(() => ({
  orphans: vi.fn(),
  keys: vi.fn(),
  attach: vi.fn(),
  forget: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchOrphanedEdits', () => ({ fetchOrphanedEdits: server.orphans }));
vi.mock('@ValenceClient/admin/fetchTitleKeys', () => ({ fetchTitleKeys: server.keys }));
vi.mock('@ValenceClient/admin/attachOrphanedEdits', () => ({ attachOrphanedEdits: server.attach }));
vi.mock('@ValenceClient/admin/forgetOrphanedEdits', () => ({ forgetOrphanedEdits: server.forget }));

const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const GONE = {
  key: 'movie:9',
  kind: 'film' as const,
  fields: 2,
  setAt: '2026-11-01T00:00:00.000Z',
  name: 'Gone Film',
};

describe('OrphanedEditsDialog', () => {
  it('attaches a gone title’s edits to a title found by its name', async () => {
    server.orphans.mockResolvedValue({ orphans: [GONE] });
    server.keys.mockResolvedValue({
      titles: [{ id: 'film-2', leadId: 'film-2', kind: 'film', name: 'Gone Film (2020)' }],
    });
    server.attach.mockResolvedValue({ edits: 2 });
    const user = userEvent.setup();

    render(<OrphanedEditsDialog libraryId="lib" isOpen onClose={vi.fn()} />);

    expect(await screen.findByText('Gone Film')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Attach to a title' }));
    await user.click(await screen.findByRole('button', { name: 'Gone Film (2020)' }));

    await waitFor(() => {
      expect(server.attach).toHaveBeenCalledWith({
        libraryId: 'lib',
        key: 'movie:9',
        toId: 'film-2',
      });
    });
  });

  it('throws a gone title’s edits away once asked', async () => {
    server.orphans.mockResolvedValue({ orphans: [GONE] });
    server.forget.mockResolvedValue({ edits: 2 });
    const user = userEvent.setup();

    render(<OrphanedEditsDialog libraryId="lib" isOpen onClose={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Delete' }));

    const asking = await screen
      .findByRole('alertdialog')
      .catch(() => screen.getAllByRole('dialog').at(-1));

    await user.click(within(asking ?? document.body).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(server.forget).toHaveBeenCalledWith({ libraryId: 'lib', key: 'movie:9' });
    });
  });

  it('says where every edit has a title', async () => {
    server.orphans.mockResolvedValue({ orphans: [] });

    render(<OrphanedEditsDialog libraryId="lib" isOpen onClose={vi.fn()} />);

    expect(
      await screen.findByText('Every edit belongs to a title still here.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OrphanedEditsDialog.displayName).toBe('OrphanedEditsDialog');
  });
});

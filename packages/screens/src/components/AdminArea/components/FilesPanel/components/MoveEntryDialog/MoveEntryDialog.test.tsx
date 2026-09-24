import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MoveEntryDialog } from './MoveEntryDialog';

const fetchFoldersMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchFolders', () => ({ fetchFolders: fetchFoldersMock }));

const ENTRY = {
  name: 'Arrival.mkv',
  path: '/media/films/Arrival.mkv',
  isFolder: false,
  sizeBytes: 6,
  modifiedAt: null,
  mediaId: null,
};

describe('MoveEntryDialog', () => {
  it('opens on the folder it is in, and says the folder chosen', async () => {
    const actor = userEvent.setup();
    const onMove = vi.fn();

    fetchFoldersMock.mockResolvedValue({
      path: '/media/films',
      parent: '/media',
      folders: [],
      isTruncated: false,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MoveEntryDialog entry={ENTRY} start="/media/films" onClose={vi.fn()} onMove={onMove} />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Move Arrival.mkv')).toBeInTheDocument();

    await actor.click(await screen.findByRole('button', { name: 'Use this folder' }));

    expect(fetchFoldersMock).toHaveBeenCalledWith('/media/films');
    expect(onMove).toHaveBeenCalledWith('/media/films');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MoveEntryDialog.displayName).toBe('MoveEntryDialog');
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { FolderBrowser } from './FolderBrowser';
import type { FolderListing } from '@ValenceContracts/schemas/Folder';

const fetchFoldersMock = vi.hoisted(() => vi.fn());

const createFolderMock = vi.hoisted(() => vi.fn());

const searchFoldersMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchFolders', () => ({ fetchFolders: fetchFoldersMock }));
vi.mock('@ValenceClient/admin/createFolder', () => ({ createFolder: createFolderMock }));
vi.mock('@ValenceClient/admin/searchFolders', () => ({ searchFolders: searchFoldersMock }));

const LISTINGS: Record<string, FolderListing> = {
  places: {
    path: null,
    parent: null,
    folders: [
      { name: '/', path: '/' },
      { name: '/media', path: '/media' },
    ],
    isTruncated: false,
  },
  '/media': {
    path: '/media',
    parent: '/',
    folders: [
      { name: 'films', path: '/media/films' },
      { name: 'shows', path: '/media/shows' },
    ],
    isTruncated: false,
  },
  '/media/films': { path: '/media/films', parent: '/media', folders: [], isTruncated: false },
  '/locked': { path: '/locked', parent: '/', folders: [], isTruncated: false },
};

beforeEach(() => {
  searchFoldersMock.mockReset();
  searchFoldersMock.mockResolvedValue({
    folders: [{ name: 'films', path: '/media/films' }],
    isTruncated: false,
  });
  createFolderMock.mockReset();
  fetchFoldersMock.mockReset();
  fetchFoldersMock.mockImplementation((path: string | null) => {
    if (path === '/locked') {
      return Promise.reject(new RequestFailed('/api/admin/folders', 403));
    }

    const found = LISTINGS[path ?? 'places'];

    return found === undefined
      ? Promise.reject(new RequestFailed('/api/admin/folders', 404))
      : Promise.resolve(found);
  });
});

/**
 * Draws the browser with a cache of its own.
 *
 * @param start - What was typed before browsing.
 * @returns What it was told.
 */
const draw = (start = '') => {
  const onChoose = vi.fn();
  const onCancel = vi.fn();

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      <FolderBrowser start={start} onChoose={onChoose} onCancel={onCancel} />
    </QueryClientProvider>,
  );

  return { onChoose, onCancel };
};

describe('FolderBrowser', () => {
  it('opens on the places to start from when nothing was typed', async () => {
    draw();

    expect(await screen.findByRole('button', { name: '/media' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use this folder' })).toBeDisabled();
  });

  it('opens on the folder already typed', async () => {
    draw('/media');

    expect(await screen.findByRole('button', { name: 'films' })).toBeInTheDocument();
  });

  it('falls back to the places to start from when the typed folder is not there', async () => {
    draw('/nowhere');

    expect(await screen.findByRole('button', { name: '/media' })).toBeInTheDocument();
  });

  it('opens a folder when it is pressed, and goes back up a level', async () => {
    const user = userEvent.setup();

    draw('/media');

    await user.click(await screen.findByRole('button', { name: 'films' }));

    expect(await screen.findByText('No folders in here.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Up a folder' }));

    expect(await screen.findByRole('button', { name: 'shows' })).toBeInTheDocument();
  });

  it('steps back along the trail to a folder on the way down', async () => {
    const user = userEvent.setup();

    draw('/media/films');

    await screen.findByText('No folders in here.');

    await user.click(screen.getByRole('button', { name: 'media' }));

    expect(await screen.findByRole('button', { name: 'films' })).toBeInTheDocument();
  });

  it('chooses the folder it is looking at', async () => {
    const user = userEvent.setup();
    const { onChoose } = draw('/media');

    await user.click(await screen.findByRole('button', { name: 'films' }));
    await screen.findByText('No folders in here.');
    await user.click(screen.getByRole('button', { name: 'Use this folder' }));

    expect(onChoose).toHaveBeenCalledWith('/media/films');
  });

  it('says so when it may not read a folder', async () => {
    draw('/locked');

    expect(
      await screen.findByText('Valence is not allowed to read that folder.'),
    ).toBeInTheDocument();
  });

  it('closes without choosing when cancelled', async () => {
    const user = userEvent.setup();
    const { onChoose, onCancel } = draw();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onChoose).not.toHaveBeenCalled();
  });
});

describe('making a folder', () => {
  it('cannot make one until there is a folder to make it in', async () => {
    draw();

    await screen.findByRole('button', { name: '/media' });

    expect(screen.getByRole('button', { name: 'New folder' })).toBeDisabled();
  });

  it('makes one inside the folder being looked at, and opens it', async () => {
    const actor = userEvent.setup();

    createFolderMock.mockResolvedValue({ name: 'anime', path: '/media/anime' });
    fetchFoldersMock.mockImplementation((path: string | null) =>
      Promise.resolve(
        path === '/media/anime'
          ? { path: '/media/anime', parent: '/media', folders: [], isTruncated: false }
          : (LISTINGS[path ?? 'places'] ?? LISTINGS['places']),
      ),
    );

    draw('/media');

    await screen.findByRole('button', { name: 'films' });
    await actor.click(screen.getByRole('button', { name: 'New folder' }));
    await actor.type(screen.getByLabelText('Folder name'), 'anime');
    await actor.click(screen.getByRole('button', { name: 'Create' }));

    expect(createFolderMock).toHaveBeenCalledWith('/media', 'anime');
    expect(await screen.findByText('/media/anime')).toBeInTheDocument();
    expect(screen.queryByLabelText('Folder name')).not.toBeInTheDocument();
  });

  it("shows the server's own words where the disk would not allow it, and stays put", async () => {
    const actor = userEvent.setup();

    createFolderMock.mockRejectedValue(new Error('That disk is read-only to Valence.'));

    draw('/media');

    await screen.findByRole('button', { name: 'films' });
    await actor.click(screen.getByRole('button', { name: 'New folder' }));
    await actor.type(screen.getByLabelText('Folder name'), 'anime');
    await actor.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('That disk is read-only to Valence.')).toBeInTheDocument();
    expect(screen.getByLabelText('Folder name')).toBeInTheDocument();
  });

  it('will not make a folder with no name', async () => {
    const actor = userEvent.setup();

    draw('/media');

    await screen.findByRole('button', { name: 'films' });
    await actor.click(screen.getByRole('button', { name: 'New folder' }));

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('puts the name away on cancel', async () => {
    const actor = userEvent.setup();

    draw('/media');

    await screen.findByRole('button', { name: 'films' });
    await actor.click(screen.getByRole('button', { name: 'New folder' }));
    await actor.click(screen.getByRole('button', { name: 'Cancel the new folder' }));

    expect(screen.queryByLabelText('Folder name')).not.toBeInTheDocument();
  });
});

describe('FolderBrowser, finding a folder', () => {
  it('finds folders by name below the one it is in, and opens the one chosen', async () => {
    const actor = userEvent.setup();
    const { onChoose } = draw('/media');

    await screen.findByRole('button', { name: 'films' });
    await actor.type(screen.getByLabelText('Find a folder'), 'fil');

    const found = await screen.findByRole('list', { name: 'Folders found' });

    expect(searchFoldersMock).toHaveBeenLastCalledWith('fil', '/media');

    await actor.click(within(found).getByRole('button', { name: /films/ }));

    expect(await screen.findByText('No folders in here.')).toBeInTheDocument();
    expect(screen.getByLabelText('Find a folder')).toHaveValue('');

    await actor.click(screen.getByRole('button', { name: 'Use this folder' }));

    expect(onChoose).toHaveBeenCalledWith('/media/films');
  });

  it('says so where nothing here is called that', async () => {
    const actor = userEvent.setup();

    searchFoldersMock.mockResolvedValue({ folders: [], isTruncated: false });
    draw('/media');

    await actor.type(await screen.findByLabelText('Find a folder'), 'nothing');

    expect(await screen.findByText('No folder here is called that.')).toBeInTheDocument();
  });

  it('goes straight to a path typed whole, without searching', async () => {
    const actor = userEvent.setup();

    draw();

    await actor.type(await screen.findByLabelText('Find a folder'), '/media');
    await actor.click(await screen.findByRole('button', { name: 'Go to /media' }));

    expect(await screen.findByRole('button', { name: 'shows' })).toBeInTheDocument();
    expect(searchFoldersMock).not.toHaveBeenCalled();
  });

  it('waits for a second letter before it searches', async () => {
    const actor = userEvent.setup();

    draw('/media');

    await actor.type(await screen.findByLabelText('Find a folder'), 'f');

    expect(screen.getByRole('button', { name: 'films' })).toBeInTheDocument();
    expect(searchFoldersMock).not.toHaveBeenCalled();
  });
});

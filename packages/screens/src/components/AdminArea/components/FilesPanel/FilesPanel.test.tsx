import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilesPanel } from './FilesPanel';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LibraryEntry, LibraryFolder } from '@ValenceContracts/schemas/LibraryFiles';

const fetchLibraryFolderMock = vi.hoisted(() => vi.fn());

const searchLibraryFilesMock = vi.hoisted(() => vi.fn());

const changeLibraryFileMock = vi.hoisted(() => vi.fn());

const createFolderMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchLibraryFolder', () => ({
  fetchLibraryFolder: fetchLibraryFolderMock,
}));
vi.mock('@ValenceClient/admin/searchLibraryFiles', () => ({
  searchLibraryFiles: searchLibraryFilesMock,
}));
vi.mock('@ValenceClient/admin/changeLibraryFile', () => ({
  changeLibraryFile: changeLibraryFileMock,
}));
vi.mock('@ValenceClient/admin/createFolder', () => ({ createFolder: createFolderMock }));

const FILMS: Library = {
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 1,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
};

const entry = (overrides: Partial<LibraryEntry>): LibraryEntry => ({
  name: 'Arrival.mkv',
  path: '/media/films/Arrival.mkv',
  isFolder: false,
  sizeBytes: 1024,
  modifiedAt: '2026-09-24T00:00:00.000Z',
  mediaId: null,
  ...overrides,
});

const FOLDERS: Record<string, LibraryFolder> = {
  libraries: {
    path: null,
    parent: null,
    libraryId: null,
    libraryPath: null,
    entries: [entry({ name: 'Films', path: '/media/films', isFolder: true, sizeBytes: null })],
    isTruncated: false,
  },
  '/media/films': {
    path: '/media/films',
    parent: null,
    libraryId: FILMS.id,
    libraryPath: '/media/films',
    entries: [
      entry({
        name: 'Arrival (2016)',
        path: '/media/films/Arrival (2016)',
        isFolder: true,
        sizeBytes: null,
      }),
      entry({ mediaId: 'm1' }),
    ],
    isTruncated: false,
  },
};

beforeEach(() => {
  fetchLibraryFolderMock.mockReset();
  fetchLibraryFolderMock.mockImplementation((path: string | null) =>
    Promise.resolve(FOLDERS[path ?? 'libraries'] ?? FOLDERS.libraries),
  );
  searchLibraryFilesMock.mockReset();
  changeLibraryFileMock.mockReset();
  changeLibraryFileMock.mockResolvedValue('/media/films/Arrival (2016).mkv');
  createFolderMock.mockReset();
});

/**
 * Draws the panel with a cache of its own.
 *
 * @param mayDelete - Whether Delete is offered.
 * @param openAt - A folder handed in to open.
 * @returns What it was told.
 */
const draw = (mayDelete = true, openAt: string | null = null) => {
  const onChanged = vi.fn();
  const onScan = vi.fn();

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <FilesPanel
        libraries={[FILMS]}
        mayDelete={mayDelete}
        openAt={openAt}
        onChanged={onChanged}
        onScan={onScan}
      />
    </QueryClientProvider>,
  );

  return { onChanged, onScan };
};

/**
 * Opens the Films library from the list of libraries.
 *
 * @param actor - Who is pressing.
 */
const openFilms = async (actor: ReturnType<typeof userEvent.setup>) => {
  await actor.click(await screen.findByRole('cell', { name: /^Films$/ }));
  await screen.findByRole('cell', { name: /Arrival\.mkv/ });
};

describe('FilesPanel', () => {
  it('offers to leave a folder out of its library, saying it takes everything in it', async () => {
    const actor = userEvent.setup();

    draw();
    await openFilms(actor);

    await actor.click(screen.getByRole('button', { name: 'Actions for Arrival (2016)' }));
    await actor.click(screen.getByRole('menuitem', { name: 'Exclude from library' }));

    expect(await screen.findByText('Exclude Arrival (2016)?')).toBeInTheDocument();
    expect(screen.getByText(/this folder and everything in it/)).toBeInTheDocument();
  });

  it('offers to leave a file out even where nothing may be deleted', async () => {
    const actor = userEvent.setup();

    draw(false);
    await openFilms(actor);

    await actor.click(screen.getByRole('button', { name: 'Actions for Arrival.mkv' }));

    expect(screen.getByRole('menuitem', { name: 'Exclude from library' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).toBeNull();
  });

  it('starts at the libraries, with nothing to do to them but open them', async () => {
    draw();

    expect(await screen.findByRole('cell', { name: /^Films$/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /New folder/ })).not.toBeInTheDocument();
  });

  it('opens a library, walks back along the trail, and says which files Valence knows', async () => {
    const actor = userEvent.setup();

    draw();
    await openFilms(actor);

    const trail = screen.getByRole('navigation', { name: 'Current folder' });

    expect(within(trail).getByRole('button', { name: 'Films' })).toBeInTheDocument();
    expect(screen.getByText('In the catalogue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New folder/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload here/ })).toBeInTheDocument();

    await actor.click(within(trail).getByRole('button', { name: 'Libraries' }));

    expect(await screen.findByRole('cell', { name: /^Films$/ })).toBeInTheDocument();
  });

  it('opens a folder it is handed, such as a library’s from the Libraries page', async () => {
    draw(true, '/media/films');

    expect(await screen.findByRole('cell', { name: /Arrival\.mkv/ })).toBeInTheDocument();
    expect(fetchLibraryFolderMock).toHaveBeenCalledWith('/media/films');
  });

  it('renames a file, and tells the page something changed', async () => {
    const actor = userEvent.setup();
    const { onChanged } = draw();

    await openFilms(actor);
    await actor.click(screen.getByRole('button', { name: 'Actions for Arrival.mkv' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Rename/ }));

    const name = await screen.findByLabelText('Name');

    await actor.clear(name);
    await actor.type(name, 'Arrival (2016).mkv');
    await actor.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() => {
      expect(changeLibraryFileMock).toHaveBeenCalledWith('/media/films/Arrival.mkv', {
        kind: 'rename',
        name: 'Arrival (2016).mkv',
      });
    });
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it('deletes only after asking, and offers no delete to whoever may not', async () => {
    const actor = userEvent.setup();

    draw();
    await openFilms(actor);
    await actor.click(screen.getByRole('button', { name: 'Actions for Arrival.mkv' }));
    await actor.click(await screen.findByRole('menuitem', { name: /Delete/ }));

    expect(changeLibraryFileMock).not.toHaveBeenCalled();

    await actor.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(changeLibraryFileMock).toHaveBeenCalledWith('/media/films/Arrival.mkv', {
        kind: 'delete',
      });
    });
  });

  it('offers no delete to whoever may not delete media', async () => {
    const actor = userEvent.setup();

    draw(false);
    await openFilms(actor);
    await actor.click(screen.getByRole('button', { name: 'Actions for Arrival.mkv' }));

    expect(await screen.findByRole('menuitem', { name: /Rename/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Delete/ })).not.toBeInTheDocument();
  });

  it('finds files by name in the folder it is in', async () => {
    const actor = userEvent.setup();

    searchLibraryFilesMock.mockResolvedValue({
      entries: [
        entry({
          name: 'Arrival.mkv',
          path: '/media/films/Arrival (2016)/Arrival.mkv',
          sizeBytes: null,
        }),
      ],
      isTruncated: false,
    });
    draw();
    await openFilms(actor);
    await actor.type(screen.getByLabelText('Search files and folders'), 'arr');

    expect(await screen.findByText('/media/films/Arrival (2016)/Arrival.mkv')).toBeInTheDocument();
    expect(searchLibraryFilesMock).toHaveBeenLastCalledWith('arr', '/media/films');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilesPanel.displayName).toBe('FilesPanel');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Answer } from '@ValenceClient/admin/sendToServer';
import type { Library } from '@ValenceContracts/schemas/Library';
import type {
  CreateImportLibraries,
  CreatedImportLibrary,
  LinkImportLibrary,
  MediaImportLibraries,
  PathMapping,
} from '@ValenceContracts/schemas/MediaImport';
import { LibrariesStep } from './LibrariesStep';

const fetchImportLibraries = vi.fn<(sourceId: string) => Promise<Answer<MediaImportLibraries>>>();
const saveImportMappings =
  vi.fn<
    (sourceId: string, mappings: readonly PathMapping[]) => Promise<Answer<MediaImportLibraries>>
  >();
const createImportLibraries =
  vi.fn<
    (
      sourceId: string,
      asked: CreateImportLibraries,
    ) => Promise<Answer<{ libraries: CreatedImportLibrary[] }>>
  >();
const linkImportLibrary =
  vi.fn<(sourceId: string, link: LinkImportLibrary) => Promise<Answer<MediaImportLibraries>>>();
const fetchLibraries = vi.fn<() => Promise<Library[]>>();
const readScanState = vi.fn<
  (jobId: string) => Promise<{
    jobId: string;
    state: 'completed';
    phase: null;
    processed: number;
    total: number;
    item: null;
  }>
>();

vi.mock('@ValenceClient/imports/fetchImportLibraries', () => ({
  fetchImportLibraries: (sourceId: string) => fetchImportLibraries(sourceId),
}));

vi.mock('@ValenceClient/imports/saveImportMappings', () => ({
  saveImportMappings: (sourceId: string, mappings: readonly PathMapping[]) =>
    saveImportMappings(sourceId, mappings),
}));

vi.mock('@ValenceClient/imports/createImportLibraries', () => ({
  createImportLibraries: (sourceId: string, asked: CreateImportLibraries) =>
    createImportLibraries(sourceId, asked),
}));

vi.mock('@ValenceClient/imports/linkImportLibrary', () => ({
  linkImportLibrary: (sourceId: string, link: LinkImportLibrary) =>
    linkImportLibrary(sourceId, link),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  readScanState: (jobId: string) => readScanState(jobId),
  fetchLibraries: () => fetchLibraries(),
}));

const SOURCE = {
  id: 'den',
  kind: 'jellyfin' as const,
  name: 'Den',
  url: 'http://den',
  version: '12.1.0',
  createdAt: '2026-10-02T00:00:00.000Z',
};

const LIBRARIES: MediaImportLibraries = {
  mappings: [],
  libraries: [
    {
      sourceLibraryId: 'films',
      name: 'Films',
      kind: 'movies',
      locations: [
        { sourcePath: '/data/movies', valencePath: '/data/movies', libraryId: 'valence-films' },
      ],
    },
    {
      sourceLibraryId: 'tv',
      name: 'Shows',
      kind: 'shows',
      locations: [
        { sourcePath: '/data/tv', valencePath: '/media/tv', libraryId: null },
        { sourcePath: '/data/kids', valencePath: '/media/kids', libraryId: null },
      ],
    },
    {
      sourceLibraryId: 'photos',
      name: 'Photos',
      kind: null,
      locations: [{ sourcePath: '/p', valencePath: '/p', libraryId: null }],
    },
  ],
};

const SHOWS: Library = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Our shows',
  kind: 'shows',
  path: '/media/tv',
  itemCount: 4,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const FILMS: Library = { ...SHOWS, id: 'valence-films', name: 'Our films', kind: 'movies' };

/**
 * Chooses what one of the folders comes into.
 *
 * @param index - Which folder, in the order they are shown.
 * @param option - The choice's name.
 */
const chooseFor = async (index: number, option: string) => {
  await userEvent.click(
    (await screen.findAllByRole('button', { name: 'Comes into' }))[index] ?? document.body,
  );
  await userEvent.click(screen.getByRole('menuitemradio', { name: new RegExp(`^${option}`) }));
};

beforeEach(() => {
  linkImportLibrary.mockReset();
  fetchLibraries.mockReset().mockResolvedValue([FILMS, SHOWS]);
  fetchImportLibraries.mockReset().mockResolvedValue({ kind: 'answered', value: LIBRARIES });
  saveImportMappings.mockReset().mockResolvedValue({ kind: 'answered', value: LIBRARIES });
  createImportLibraries.mockReset();
  readScanState.mockReset().mockResolvedValue({
    jobId: 'scan',
    state: 'completed',
    phase: null,
    processed: 1,
    total: 1,
    item: null,
  });
});

describe('LibrariesStep', () => {
  it('shows each folder, where it is in Valence, and which libraries are already there', async () => {
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText('/data/tv → /media/tv')).toBeVisible();
    expect(screen.getAllByText('Already in Valence')).toHaveLength(1);
    expect(screen.getByText(/Valence has no library like this/)).toBeVisible();
  });

  it('makes and scans the chosen libraries, follows the scans, and goes on once they finish', async () => {
    const onContinue = vi.fn();

    createImportLibraries.mockResolvedValue({
      kind: 'answered',
      value: {
        libraries: [
          { sourcePath: '/data/tv', libraryId: 'new', jobId: 'scan', problem: null },
          {
            sourcePath: '/data/kids',
            libraryId: null,
            jobId: null,
            problem: {
              code: null,
              message: 'Valence cannot see a folder at /media/kids.',
              values: {},
            },
          },
        ],
      },
    });
    render(<LibrariesStep source={SOURCE} onContinue={onContinue} onBack={vi.fn()} />);

    await chooseFor(2, 'Leave it out');
    await chooseFor(2, 'A new library, made and scanned now');
    await userEvent.click(screen.getByRole('button', { name: 'Make and scan these libraries' }));

    expect(createImportLibraries).toHaveBeenCalledWith('den', {
      libraries: [
        { sourceLibraryId: 'tv', sourcePath: '/data/tv', name: 'Shows 1', kind: 'shows' },
        { sourceLibraryId: 'tv', sourcePath: '/data/kids', name: 'Shows 2', kind: 'shows' },
      ],
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Valence cannot see a folder at /media/kids.',
    );
    expect(screen.getByLabelText('Scanning Shows 1')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
      },
      { timeout: 3000 },
    );
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('leaves out a folder that is not wanted, and saves the mappings', async () => {
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    await chooseFor(1, 'Leave it out');
    await chooseFor(2, 'Leave it out');

    expect(screen.getByRole('button', { name: 'Make and scan these libraries' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Save and look again' }));

    expect(saveImportMappings).toHaveBeenCalledWith('den', []);
  });

  it('offers only the existing libraries of the same kind, and links a folder into one', async () => {
    linkImportLibrary.mockResolvedValue({
      kind: 'answered',
      value: {
        mappings: [],
        libraries: [
          {
            sourceLibraryId: 'tv',
            name: 'Shows',
            kind: 'shows',
            locations: [{ sourcePath: '/data/tv', valencePath: '/media/tv', libraryId: SHOWS.id }],
          },
        ],
      },
    });
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Comes into' }))[1] ?? document.body,
    );

    expect(screen.queryByRole('menuitemradio', { name: /^Our films/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitemradio', { name: /^Our shows/ }));

    expect(linkImportLibrary).toHaveBeenCalledWith('den', {
      sourceLibraryId: 'tv',
      sourcePath: '/data/tv',
      libraryId: SHOWS.id,
    });
    expect(await screen.findAllByText('Already in Valence')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Comes into' })).toHaveTextContent('Our shows');
  });

  it('says why a folder could not be linked', async () => {
    linkImportLibrary.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'That library is gone.' },
    });
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    await chooseFor(1, 'Our shows');

    expect(await screen.findByText(/That library is gone\./)).toBeVisible();
  });

  it('carries on without the existing libraries when they cannot be read', async () => {
    fetchLibraries.mockRejectedValue(new Error('down'));
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Comes into' }))[1] ?? document.body,
    );

    expect(screen.getAllByRole('menuitemradio')).toHaveLength(2);
  });

  it('says why the libraries could not be read', async () => {
    fetchImportLibraries.mockResolvedValue({
      kind: 'refused',
      refusal: { message: 'Den could not be reached.' },
    });
    render(<LibrariesStep source={SOURCE} onContinue={vi.fn()} onBack={vi.fn()} />);

    expect(await screen.findByText(/Den could not be reached\./)).toBeVisible();
  });
});

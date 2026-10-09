import { useCallback, useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddLibrariesStep } from './AddLibrariesStep';
import type * as FetchLibrary from '@ValenceClient/library/fetchLibrary';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { AddLibraryDialogProps } from '@ValenceScreens/components/AddLibraryDialog/AddLibraryDialog.types';
import type { ScanFollowerProps } from '@ValenceScreens/components/ScanFollower/ScanFollower.types';

const aLibrary = (id: string, name: string, itemCount = 0): Library => ({
  id,
  name,
  kind: 'movies',
  path: `/media/${name.toLowerCase()}`,
  itemCount,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
});

const FILMS = aLibrary('00000000-0000-4000-8000-000000000001', 'Films', 12);

const SERIES = aLibrary('00000000-0000-4000-8000-000000000002', 'Series');

const fetchLibraries = vi.hoisted(() => vi.fn<() => Promise<Library[]>>());
const scanLibrary = vi.hoisted(() =>
  vi.fn<(libraryId: string) => Promise<{ jobId: string } | null>>(),
);

vi.mock('@ValenceClient/library/fetchLibrary', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchLibrary>()),
  fetchLibraries,
  scanLibrary,
}));

vi.mock('@ValenceScreens/components/AddLibraryDialog/AddLibraryDialog', () => ({
  AddLibraryDialog: ({ isOpen, onClose, onCreated }: AddLibraryDialogProps) =>
    isOpen ? (
      <div role="dialog" aria-label="Add a library">
        <button
          type="button"
          onClick={() => {
            onCreated(SERIES);
          }}
        >
          Create it
        </button>
        <button type="button" onClick={onClose}>
          Close it
        </button>
      </div>
    ) : null,
}));

vi.mock('@ValenceScreens/components/ScanFollower/ScanFollower', () => ({
  ScanFollower: ({ jobId, name }: ScanFollowerProps) => (
    <span>
      Following {name} as {jobId}
    </span>
  ),
}));

const Held = ({
  start = null,
  onBack = vi.fn(),
  onContinue = vi.fn(),
}: {
  start?: Library[] | null;
  onBack?: () => void;
  onContinue?: () => void;
}) => {
  const [libraries, setLibraries] = useState<Library[] | null>(start);
  const [scans, setScans] = useState<ReadonlyMap<string, string>>(new Map());
  const read = useCallback((found: Library[]) => {
    setLibraries(found);
  }, []);

  return (
    <AddLibrariesStep
      libraries={libraries}
      scans={scans}
      onRead={read}
      onAdded={(library, jobId) => {
        setLibraries((held) => [...(held ?? []), library]);

        if (jobId !== null) {
          setScans((held) => new Map(held).set(library.id, jobId));
        }
      }}
      onBack={onBack}
      onContinue={onContinue}
    />
  );
};

beforeEach(() => {
  fetchLibraries.mockReset().mockResolvedValue([]);
  scanLibrary.mockReset().mockResolvedValue({ jobId: 'job-1' });
});

describe('AddLibrariesStep', () => {
  it('reads the libraries already there before listing them', async () => {
    fetchLibraries.mockResolvedValue([FILMS]);

    render(<Held />);

    expect(screen.getByRole('status', { name: 'Loading libraries' })).toBeInTheDocument();
    expect(await screen.findByText('/media/films')).toBeInTheDocument();
    expect(screen.getAllByText('Films')).toHaveLength(2);
    expect(screen.getByText('12 items')).toBeInTheDocument();
  });

  it('does not read them again once it has them', () => {
    render(<Held start={[FILMS]} />);

    expect(fetchLibraries).not.toHaveBeenCalled();
  });

  it('treats libraries that could not be read as none, and can be skipped', async () => {
    fetchLibraries.mockRejectedValue(new Error('down'));
    const onContinue = vi.fn();

    render(<Held onContinue={onContinue} />);

    expect(await screen.findByRole('button', { name: 'Add a library' })).toBeInTheDocument();
    expect(screen.getByText(/Moving from Jellyfin, Emby or Plex/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Skip for now' }));

    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('adds a library, reads it straight away and follows the reading', async () => {
    render(<Held start={[FILMS]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add another library' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create it' }));

    expect(await screen.findByText('Following Series as job-1')).toBeInTheDocument();
    expect(scanLibrary).toHaveBeenCalledWith(SERIES.id);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/Scanning continues in the background/)).toBeInTheDocument();
  });

  it('lists a library whose reading did not start, without following it', async () => {
    scanLibrary.mockResolvedValue(null);

    render(<Held start={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a library' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create it' }));

    expect(await screen.findByText('Series')).toBeInTheDocument();
    expect(screen.getByText('0 items')).toBeInTheDocument();
    expect(screen.queryByText(/Following/)).not.toBeInTheDocument();
  });

  it('closes the dialog without adding anything', async () => {
    render(<Held start={[]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add a library' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close it' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(scanLibrary).not.toHaveBeenCalled();
  });

  it('goes on once there is a library, and back when asked', async () => {
    const onContinue = vi.fn();
    const onBack = vi.fn();

    render(<Held start={[FILMS]} onContinue={onContinue} onBack={onBack} />);

    expect(screen.queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));

    expect(onContinue).toHaveBeenCalledOnce();
    expect(onBack).toHaveBeenCalledOnce();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RunLibraryJobDialog } from './RunLibraryJobDialog';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';

const SCAN: JobDefinition = {
  kind: 'library.scan',
  label: 'Scan for changes',
  description: 'Finds new, changed and removed files.',
  needsLibrary: true,
  destructive: false,
  takesParts: false,
};

const RESET: JobDefinition = {
  kind: 'library.reset',
  label: 'Reset and rebuild',
  description: 'Deletes every item and starts again.',
  needsLibrary: true,
  destructive: true,
  takesParts: false,
};

const MOVIES: Library = {
  id: 'lib-movies',
  name: 'Movies',
  kind: 'movies',
  path: '/media/movies',
  itemCount: 10,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
};

const SHOWS: Library = { ...MOVIES, id: 'lib-shows', name: 'Shows', kind: 'shows' };

describe('RunLibraryJobDialog', () => {
  it('shows nothing while no job is chosen', () => {
    render(
      <RunLibraryJobDialog
        definition={null}
        libraries={[MOVIES]}
        onClose={vi.fn()}
        onRun={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts with every library ticked', async () => {
    const onRun = vi.fn();

    render(
      <RunLibraryJobDialog
        definition={SCAN}
        libraries={[MOVIES, SHOWS]}
        onClose={vi.fn()}
        onRun={onRun}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Every library' })).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Run on every library' }));

    expect(onRun).toHaveBeenCalledWith('library.scan', ['lib-movies', 'lib-shows']);
  });

  it('runs on only the libraries left ticked', async () => {
    const onRun = vi.fn();

    render(
      <RunLibraryJobDialog
        definition={SCAN}
        libraries={[MOVIES, SHOWS]}
        onClose={vi.fn()}
        onRun={onRun}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Shows/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Run on 1 library' }));

    expect(onRun).toHaveBeenCalledWith('library.scan', ['lib-movies']);
  });

  it('will not run on no libraries at all', async () => {
    render(
      <RunLibraryJobDialog
        definition={SCAN}
        libraries={[MOVIES, SHOWS]}
        onClose={vi.fn()}
        onRun={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Every library' }));

    expect(screen.getByRole('button', { name: 'Run on 0 libraries' })).toBeDisabled();
  });

  it('warns that a destructive job cannot be undone, and names what it does', () => {
    render(
      <RunLibraryJobDialog
        definition={RESET}
        libraries={[MOVIES]}
        onClose={vi.fn()}
        onRun={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reset and rebuild?' })).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset and rebuild on every library' })).toHaveClass(
      'bg-danger',
    );
  });

  it('lets the operator back out', async () => {
    const onClose = vi.fn();
    const onRun = vi.fn();

    render(
      <RunLibraryJobDialog
        definition={SCAN}
        libraries={[MOVIES]}
        onClose={onClose}
        onRun={onRun}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onRun).not.toHaveBeenCalled();
  });

  it('ticks every library again when opened for another job', async () => {
    const { rerender } = render(
      <RunLibraryJobDialog
        definition={SCAN}
        libraries={[MOVIES, SHOWS]}
        onClose={vi.fn()}
        onRun={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: /Shows/ }));

    rerender(
      <RunLibraryJobDialog
        definition={RESET}
        libraries={[MOVIES, SHOWS]}
        onClose={vi.fn()}
        onRun={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Every library' })).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RunLibraryJobDialog.displayName).toBe('RunLibraryJobDialog');
  });
});

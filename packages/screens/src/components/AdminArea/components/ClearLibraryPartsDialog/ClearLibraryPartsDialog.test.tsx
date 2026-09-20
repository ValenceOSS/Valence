import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ClearLibraryPartsDialog } from './ClearLibraryPartsDialog';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';

const CLEAR: JobDefinition = {
  kind: 'library.clearParts',
  label: 'Clear and fetch again',
  description: 'Erases the chosen parts of a library.',
  needsLibrary: true,
  destructive: true,
  takesParts: true,
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

const MUSIC: Library = { ...MOVIES, id: 'lib-music', name: 'Music', kind: 'music' };

const BOOKS: Library = { ...MOVIES, id: 'lib-books', name: 'Books', kind: 'books' };

/**
 * Opens the dialog over the given libraries.
 */
const open = (libraries: Library[], onClear = vi.fn(), onClose = vi.fn()) =>
  render(
    <ClearLibraryPartsDialog
      definition={CLEAR}
      libraries={libraries}
      onClose={onClose}
      onClear={onClear}
    />,
  );

describe('ClearLibraryPartsDialog', () => {
  it('shows nothing while no job is chosen', () => {
    render(
      <ClearLibraryPartsDialog
        definition={null}
        libraries={[MOVIES]}
        onClose={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('starts with every library ticked and no part, so nothing goes unchosen', () => {
    open([MOVIES]);

    expect(screen.getByRole('checkbox', { name: 'Every library' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /^Descriptions/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Clear 0 parts' })).toBeDisabled();
  });

  it('clears the parts chosen from the libraries chosen', async () => {
    const onClear = vi.fn();

    open([MOVIES], onClear);

    await userEvent.click(screen.getByRole('checkbox', { name: /^Trailers/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^Logos/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear 2 parts' }));

    expect(onClear).toHaveBeenCalledWith(
      'library.clearParts',
      ['lib-movies'],
      ['trailers', 'logos'],
    );
  });

  it('offers only what the ticked libraries have', async () => {
    open([MOVIES, MUSIC]);

    expect(screen.getByRole('checkbox', { name: /^Trailers/ })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Lyrics/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /^Movies/ }));

    expect(screen.queryByRole('checkbox', { name: /^Trailers/ })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Lyrics/ })).toBeInTheDocument();
  });

  it('stops clearing a part once no ticked library has it', async () => {
    const onClear = vi.fn();

    open([MOVIES, MUSIC], onClear);

    await userEvent.click(screen.getByRole('checkbox', { name: /^Cast/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^Lyrics/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^Movies/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear 1 part' }));

    expect(onClear).toHaveBeenCalledWith('library.clearParts', ['lib-music'], ['lyrics']);
  });

  it('says there is nothing to clear in a library where nothing is fetched', () => {
    open([BOOKS]);

    expect(screen.getByText(/nothing to clear/)).toBeInTheDocument();
  });

  it('asks for a library before it offers any part', async () => {
    open([MOVIES]);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Every library' }));

    expect(screen.getByText('Choose a library to see what can be cleared.')).toBeInTheDocument();
  });

  it('warns when getting a part back means reading every file again', async () => {
    open([MOVIES]);

    await userEvent.click(screen.getByRole('checkbox', { name: /^Logos/ }));

    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /^Descriptions/ }));

    expect(screen.getByRole('note')).toHaveTextContent(/reading every file/);
  });

  it('lets a part be ticked and cleared again', async () => {
    open([MOVIES]);

    await userEvent.click(screen.getByRole('checkbox', { name: /^Cast/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /^Cast/ }));

    expect(screen.getByRole('button', { name: 'Clear 0 parts' })).toBeDisabled();
  });

  it('warns that clearing cannot be undone', () => {
    open([MOVIES]);

    expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
  });

  it('lets the operator back out', async () => {
    const onClose = vi.fn();
    const onClear = vi.fn();

    open([MOVIES], onClear, onClose);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
  });

  it('forgets what was ticked when opened again', async () => {
    const { rerender } = open([MOVIES]);

    await userEvent.click(screen.getByRole('checkbox', { name: /^Cast/ }));

    rerender(
      <ClearLibraryPartsDialog
        definition={null}
        libraries={[MOVIES]}
        onClose={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    rerender(
      <ClearLibraryPartsDialog
        definition={CLEAR}
        libraries={[MOVIES]}
        onClose={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: /^Cast/ })).not.toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ClearLibraryPartsDialog.displayName).toBe('ClearLibraryPartsDialog');
  });
});

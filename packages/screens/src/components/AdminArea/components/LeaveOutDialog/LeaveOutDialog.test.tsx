import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { LeaveOutDialog } from './LeaveOutDialog';
import type { LeaveOutTarget } from './LeaveOutDialog.types';

const leaveOutMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/leaveOut', () => ({ leaveOut: leaveOutMock }));

const FILE: LeaveOutTarget = {
  libraryId: 'library-1',
  libraryPath: '/media/films',
  path: '/media/films/Broken (2019)/Broken.mkv',
  name: 'Broken',
  isFolder: false,
};

const open = (target: LeaveOutTarget | null, onClose = vi.fn()) => {
  render(<LeaveOutDialog target={target} onClose={onClose} />, { wrapper: CacheScope });

  return { onClose };
};

beforeEach(() => {
  leaveOutMock.mockReset();
});

describe('LeaveOutDialog', () => {
  it('asks about the file it names, shown from inside its library', () => {
    open(FILE);

    expect(screen.getByText('Exclude Broken?')).toBeInTheDocument();
    expect(screen.getByText('Broken (2019)/Broken.mkv')).toBeInTheDocument();
    expect(screen.getByText(/Nothing is deleted from disk/)).toBeInTheDocument();
  });

  it('says a folder takes everything in it along', () => {
    open({ ...FILE, path: '/media/films/Extras', name: 'Extras', isFolder: true });

    expect(screen.getByText(/this folder and everything in it/)).toBeInTheDocument();
  });

  it('leaves it out with why, then closes', async () => {
    const user = userEvent.setup();

    leaveOutMock.mockResolvedValue({ leftOut: {}, jobId: null });

    const { onClose } = open(FILE);

    await user.type(screen.getByLabelText('Why'), 'Stutters');
    await user.click(screen.getByRole('button', { name: 'Don’t import' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(leaveOutMock).toHaveBeenCalledWith('library-1', FILE.path, 'Stutters');
  });

  it('sends no note where none was written', async () => {
    const user = userEvent.setup();

    leaveOutMock.mockResolvedValue({ leftOut: {}, jobId: null });
    open(FILE);

    await user.click(screen.getByRole('button', { name: 'Don’t import' }));

    await waitFor(() => {
      expect(leaveOutMock).toHaveBeenCalledWith('library-1', FILE.path, null);
    });
  });

  it('says why the server refused, and stays open', async () => {
    const user = userEvent.setup();

    leaveOutMock.mockRejectedValue(new Error('That isn’t inside this library.'));

    const { onClose } = open(FILE);

    await user.click(screen.getByRole('button', { name: 'Don’t import' }));

    expect(await screen.findByText('That isn’t inside this library.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('is shut while nothing is to be left out', () => {
    open(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LeaveOutDialog.displayName).toBe('LeaveOutDialog');
  });
});

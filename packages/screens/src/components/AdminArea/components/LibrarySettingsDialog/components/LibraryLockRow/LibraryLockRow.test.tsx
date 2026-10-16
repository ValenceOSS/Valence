import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { saveLibraryLock } from '@ValenceClient/admin/saveLibraryLock';
import { LibraryLockRow } from './LibraryLockRow';

vi.mock('@ValenceClient/admin/saveLibraryLock', () => ({ saveLibraryLock: vi.fn() }));

beforeEach(() => {
  vi.mocked(saveLibraryLock).mockReset().mockResolvedValue(true);
});

describe('LibraryLockRow', () => {
  it('locks the library with the secret typed, relocking after as long as asked', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<LibraryLockRow libraryId="kids" hasLock={false} />);

    await user.type(screen.getByLabelText('New password or PIN'), '2468');
    await user.clear(screen.getByLabelText('Locks again after (minutes)'));
    await user.type(screen.getByLabelText('Locks again after (minutes)'), '30');
    await user.click(screen.getByRole('button', { name: 'Lock it' }));

    expect(saveLibraryLock).toHaveBeenCalledWith('kids', { secret: '2468', relockMinutes: 30 });
  });

  it('will not lock it with a secret too short to keep anybody out', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<LibraryLockRow libraryId="kids" hasLock={false} />);

    await user.type(screen.getByLabelText('New password or PIN'), '24');

    expect(screen.getByRole('button', { name: 'Lock it' })).toBeDisabled();
  });

  it('takes a lock away, where there is one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<LibraryLockRow libraryId="kids" hasLock />);

    await user.click(screen.getByRole('button', { name: 'Take the lock away' }));

    expect(saveLibraryLock).toHaveBeenCalledWith('kids', { secret: null, relockMinutes: 60 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LibraryLockRow.displayName).toBe('LibraryLockRow');
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { unlockLibrary } from '@ValenceClient/library/unlockLibrary';
import { LockedLibrary } from './LockedLibrary';

vi.mock('@ValenceClient/library/unlockLibrary', () => ({ unlockLibrary: vi.fn() }));

beforeEach(() => {
  vi.mocked(unlockLibrary).mockReset();
});

describe('LockedLibrary', () => {
  it('unlocks the library with what was typed', async () => {
    vi.mocked(unlockLibrary).mockResolvedValue({ kind: 'unlocked', untilMs: 2000 });
    const user = userEvent.setup();

    renderInAnAddress(<LockedLibrary library={{ id: 'kids', name: 'Late night' }} />);

    expect(screen.getByText('Late night is locked')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Password or PIN'), '2468');
    await user.click(screen.getByRole('button', { name: 'Unlock' }));

    expect(unlockLibrary).toHaveBeenCalledWith('kids', '2468');
  });

  it('says so when it is not the right one', async () => {
    vi.mocked(unlockLibrary).mockResolvedValue({ kind: 'wrong' });
    const user = userEvent.setup();

    renderInAnAddress(<LockedLibrary library={{ id: 'kids', name: 'Late night' }} />);

    await user.type(screen.getByLabelText('Password or PIN'), '0000{Enter}');

    expect(
      await screen.findByText('That isn’t the password or PIN for this library.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LockedLibrary.displayName).toBe('LockedLibrary');
  });
});

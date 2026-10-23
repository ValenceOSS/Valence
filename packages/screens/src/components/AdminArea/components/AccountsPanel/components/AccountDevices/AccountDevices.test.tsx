import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AccountDevices } from './AccountDevices';
import type * as Notify from '@ValenceUI/notify';

const { fetchMock, endMock, workedMock, failedMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  endMock: vi.fn(),
  workedMock: vi.fn(),
  failedMock: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchAccountSessions', () => ({
  fetchAccountSessions: fetchMock,
  endAccountSession: endMock,
}));

vi.mock('@ValenceUI/notify', async (importOriginal) => {
  const actual = await importOriginal<typeof Notify>();

  return { ...actual, notify: { ...actual.notify, worked: workedMock, failed: failedMock } };
});

const A_SESSION = {
  id: 'session-1',
  name: sayVerbatim('Living room television'),
  address: null,
  signedInAt: '2026-10-01T00:00:00.000Z',
  expiresAt: '2026-11-01T00:00:00.000Z',
};

/**
 * Signs the one device out, through its menu and the question that follows.
 */
const signItOut = async () => {
  const user = userEvent.setup();

  await user.click(await screen.findByRole('button', { name: /Living room television/ }));
  await user.click(await screen.findByRole('menuitem', { name: 'Sign out this device' }));
  await user.click(await screen.findByRole('button', { name: 'Sign out device' }));
};

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue([A_SESSION]);
  endMock.mockReset();
  workedMock.mockReset();
  failedMock.mockReset();
});

describe('AccountDevices', () => {
  it('says a device is signed out once it is', async () => {
    endMock.mockResolvedValue(null);
    renderInAnAddress(<AccountDevices accountId="account-1" />);

    await signItOut();

    await waitFor(() => {
      expect(workedMock).toHaveBeenCalledWith('Living room television is signed out.');
    });
  });

  it('says why a device could not be signed out, rather than nothing', async () => {
    endMock.mockResolvedValue({ message: 'You may not do that.' });
    renderInAnAddress(<AccountDevices accountId="account-1" />);

    await signItOut();

    await waitFor(() => {
      expect(failedMock).toHaveBeenCalledWith('You may not do that.');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AccountDevices.displayName).toBe('AccountDevices');
  });
});

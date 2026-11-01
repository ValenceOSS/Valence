import { ReadDeviceSchema } from '@ValenceContracts/schemas/SignedInDevice';
import { DeviceIdentitySchema } from '@ValenceContracts/schemas/DeviceIdentity';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeviceList } from './DeviceList';
import type { Device } from '@ValenceClient/account/fetchDevices';

const isDemo = vi.hoisted(() => vi.fn<() => boolean>());

vi.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({ may: () => true, mayAdminister: false, isDemo: isDemo() }),
}));

const fetchDevices = vi.fn<() => Promise<Device[]>>();
const endDevice = vi.fn<(deviceId: string) => Promise<boolean>>();
const endOtherDevices = vi.fn<() => Promise<boolean>>();
const renameDevice = vi.fn<(deviceId: string, name: string | null) => Promise<boolean>>();

vi.mock('@ValenceClient/account/fetchDevices', () => ({
  fetchDevices: () => fetchDevices(),
  endDevice: (deviceId: string) => endDevice(deviceId),
  endOtherDevices: () => endOtherDevices(),
  renameDevice: (deviceId: string, name: string | null) => renameDevice(deviceId, name),
}));

const failed = vi.hoisted(() => vi.fn<(message: string) => void>());

vi.mock('@ValenceUI/notify', () => ({ notify: { failed } }));

const device = (overrides: Partial<Device> = {}): Device =>
  ReadDeviceSchema.parse({
    id: 'session-1',
    name: sayVerbatim('Chrome on macOS'),
    address: '10.0.0.2',
    signedInAt: '2026-08-10T09:00:00.000Z',
    expiresAt: '2026-09-10T00:00:00.000Z',
    isCurrent: false,
    ...overrides,
  });

beforeEach(() => {
  isDemo.mockReset().mockReturnValue(false);
  fetchDevices.mockReset().mockResolvedValue([]);
  endDevice.mockReset().mockResolvedValue(true);
  endOtherDevices.mockReset().mockResolvedValue(true);
  renameDevice.mockReset().mockResolvedValue(true);
  failed.mockReset();
});

/**
 * Renames a device the way a person does: the menu, then the dialog.
 */
const rename = async (user: ReturnType<typeof userEvent.setup>, name: string, to: string) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: /Rename/ }));
  await user.clear(await screen.findByLabelText('Name'));

  if (to !== '') {
    await user.type(screen.getByLabelText('Name'), to);
  }

  await user.click(screen.getByRole('button', { name: 'Save' }));
};

/**
 * Signs a device out the way a person does: the menu, then the confirmation.
 */
const signOut = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: /Sign out this device/ }));
  await user.click(await screen.findByRole('button', { name: 'Sign out device' }));
};

describe('DeviceList', () => {
  it('lists everywhere this account is signed in', async () => {
    fetchDevices.mockResolvedValue([
      device(),
      device({ id: 'session-2', name: sayVerbatim('Safari on iPhone') }),
    ]);

    render(<DeviceList />);

    expect(await screen.findByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
  });

  it('marks the one being used, since somebody wants to know which they are holding', async () => {
    fetchDevices.mockResolvedValue([device({ isCurrent: true })]);

    render(<DeviceList />);

    expect(await screen.findByText('This device')).toBeInTheDocument();
  });

  it('offers no way to sign out of the page you are signing things out from', async () => {
    fetchDevices.mockResolvedValue([device({ isCurrent: true })]);

    render(<DeviceList />);
    await screen.findByText('This device');

    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('signs one out on request, and asks again afterwards', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([device()]);

    render(<DeviceList />);
    await signOut(user, 'Chrome on macOS');

    expect(endDevice).toHaveBeenCalledWith('session-1');
    await waitFor(() => {
      expect(fetchDevices).toHaveBeenCalledTimes(2);
    });
  });

  it('offers to rename the device being used, but not to sign it out', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([device({ isCurrent: true })]);

    render(<DeviceList />);
    await user.click(await screen.findByRole('button', { name: 'Actions for Chrome on macOS' }));

    expect(await screen.findByRole('menuitem', { name: /Rename/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /Sign out this device/ }),
    ).not.toBeInTheDocument();
  });

  it('names a device apart from what it reaches Valence through', async () => {
    fetchDevices.mockResolvedValue([
      device({ device: sayVerbatim('Dan’s MacBook Pro'), client: sayVerbatim('Chrome on macOS') }),
    ]);

    render(<DeviceList />);

    expect(await screen.findByText('Dan’s MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
  });

  it('renames a device on request, and asks again afterwards', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([device()]);

    render(<DeviceList />);
    await rename(user, 'Chrome on macOS', 'Work laptop');

    await waitFor(() => {
      expect(fetchDevices).toHaveBeenCalledTimes(2);
    });
    expect(renameDevice).toHaveBeenCalledWith('session-1', 'Work laptop');
    expect(failed).not.toHaveBeenCalled();
  });

  it('starts the rename with what the device was renamed to, and says what emptying it goes back to', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([
      device({
        device: sayVerbatim('Work laptop'),
        renamed: 'Work laptop',
        identity: DeviceIdentitySchema.parse({
          app: 'browser',
          system: 'macos',
          form: 'computer',
          browser: 'chrome',
        }),
      }),
    ]);

    render(<DeviceList />);
    await user.click(await screen.findByRole('button', { name: 'Actions for Work laptop' }));
    await user.click(await screen.findByRole('menuitem', { name: /Rename/ }));

    expect(await screen.findByLabelText('Name')).toHaveValue('Work laptop');
    expect(screen.getByText('Leave it empty to go back to Mac.')).toBeInTheDocument();
  });

  it('gives a device back its own name when the name is emptied', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([device({ renamed: 'Work laptop' })]);

    render(<DeviceList />);
    await rename(user, 'Chrome on macOS', '');

    await waitFor(() => {
      expect(renameDevice).toHaveBeenCalledWith('session-1', null);
    });
  });

  it('says so when a device could not be renamed', async () => {
    const user = userEvent.setup();

    renameDevice.mockResolvedValue(false);
    fetchDevices.mockResolvedValue([device()]);

    render(<DeviceList />);
    await rename(user, 'Chrome on macOS', 'Work laptop');

    await waitFor(() => {
      expect(failed).toHaveBeenCalledWith('That device couldn’t be renamed.');
    });
  });

  it('offers to sign out everywhere else only where there is an else', async () => {
    fetchDevices.mockResolvedValue([device({ isCurrent: true })]);

    render(<DeviceList />);
    await screen.findByText('This device');

    expect(
      screen.queryByRole('button', { name: /Sign out everywhere else/ }),
    ).not.toBeInTheDocument();
  });

  it('lists the devices of a shared demo account but signs none of them out', async () => {
    isDemo.mockReturnValue(true);
    fetchDevices.mockResolvedValue([device({ isCurrent: true }), device({ id: 'session-2' })]);

    render(<DeviceList />);

    expect(await screen.findByText('This device')).toBeInTheDocument();
    expect(screen.getAllByText('Chrome on macOS')).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: /Sign out everywhere else/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for Chrome on macOS' }),
    ).not.toBeInTheDocument();
  });

  it('signs out everywhere else on request', async () => {
    const user = userEvent.setup();

    fetchDevices.mockResolvedValue([device({ isCurrent: true }), device({ id: 'session-2' })]);

    render(<DeviceList />);
    await user.click(await screen.findByRole('button', { name: /Sign out everywhere else/ }));
    await user.click(await screen.findByRole('button', { name: 'Sign out all' }));

    expect(endOtherDevices).toHaveBeenCalled();
  });

  it('puts that way out in the strip of the card holding the devices', async () => {
    fetchDevices.mockResolvedValue([device({ isCurrent: true }), device({ id: 'session-2' })]);

    render(<DeviceList />);

    const strip = (await screen.findByRole('heading', { name: 'Devices' })).closest('header');

    expect(strip).not.toBeNull();
    expect(
      await within(strip ?? document.body).findByRole('button', {
        name: /Sign out everywhere else/,
      }),
    ).toBeInTheDocument();
  });

  it('says so plainly when it has nothing to show', async () => {
    render(<DeviceList />);

    expect(await screen.findByText(/No signed-in devices were found/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DeviceList.displayName).toBe('DeviceList');
  });
});

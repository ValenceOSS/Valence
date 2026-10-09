import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ConnectedAppsControl } from './ConnectedAppsControl';

const admin = vi.hoisted(() => ({ controlsConnectedApps: false }));

const saveControlsConnectedApps = vi.hoisted(() =>
  vi.fn<(controls: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
);

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  fetchAdminOverview: () =>
    Promise.resolve({ settings: { controlsConnectedApps: admin.controlsConnectedApps } }),
  saveControlsConnectedApps,
}));

beforeEach(() => {
  admin.controlsConnectedApps = false;
  saveControlsConnectedApps.mockReset().mockImplementation((controls) => {
    admin.controlsConnectedApps = controls;

    return Promise.resolve(true);
  });
});

describe('ConnectedAppsControl', () => {
  it('turns on controlling the connected apps from Valence, and stays on once saved', async () => {
    renderInAnAddress(<ConnectedAppsControl />);

    const toggle = screen.getByRole('switch', { name: 'Control connected apps from Valence' });

    await waitFor(() => {
      expect(toggle).toBeEnabled();
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(toggle);

    expect(saveControlsConnectedApps).toHaveBeenCalledWith(true);
    await waitFor(() => {
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });
    await waitFor(() => {
      expect(toggle).toBeEnabled();
    });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('turns back where it could not be saved', async () => {
    saveControlsConnectedApps.mockResolvedValue(false);

    renderInAnAddress(<ConnectedAppsControl />);

    const toggle = screen.getByRole('switch', { name: 'Control connected apps from Valence' });

    await waitFor(() => {
      expect(toggle).toBeEnabled();
    });
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toBeEnabled();
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ConnectedAppsControl.displayName).toBe('ConnectedAppsControl');
  });
});

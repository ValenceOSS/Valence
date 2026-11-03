import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type * as FetchRequests from '@ValenceClient/requests/fetchRequests';
import { AlertsPanel } from './AlertsPanel';

const fetchAdminOverview = vi.hoisted(() => vi.fn());
const saveHiddenAlerts = vi.hoisted(() => vi.fn());
const fetchRequestsAvailability = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  fetchAdminOverview,
  saveHiddenAlerts,
}));
vi.mock('@ValenceClient/requests/fetchRequests', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchRequests>()),
  fetchRequestsAvailability,
}));

const draw = () =>
  render(
    <CacheScope>
      <AlertsPanel />
    </CacheScope>,
  );

const server: { held: readonly string[] } = { held: [] };

beforeEach(() => {
  server.held = [];
  fetchAdminOverview
    .mockReset()
    .mockImplementation(() => Promise.resolve({ settings: { hiddenAlerts: [...server.held] } }));
  saveHiddenAlerts.mockReset().mockImplementation((next: readonly string[]) => {
    server.held = [...next];

    return Promise.resolve(true);
  });
  fetchRequestsAvailability.mockReset().mockResolvedValue({ isEnabled: false });
});

describe('AlertsPanel', () => {
  it('turns an alert needing attention off straight away', async () => {
    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Low memory' }));

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledWith(['memory']);
    });
    expect(screen.getByRole('switch', { name: 'Low memory' })).not.toBeChecked();
  });

  it('asks before turning off an alert about something broken, and leaves it on if told no', async () => {
    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Media service unreachable' }));

    expect(screen.getByText('Turn off this alert?')).toBeInTheDocument();
    expect(saveHiddenAlerts).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(saveHiddenAlerts).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Media service unreachable' })).toBeChecked();
  });

  it('turns an alert about something broken off once that is confirmed', async () => {
    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Media service unreachable' }));
    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }));

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledWith(['transcoder']);
    });
  });

  it('turns an alert back on without asking', async () => {
    server.held = ['transcoder', 'memory'];

    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Media service unreachable' }));

    expect(screen.queryByText('Turn off this alert?')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledWith(['memory']);
    });
  });

  it('turns every alert back on at once', async () => {
    server.held = ['transcoder', 'memory'];

    draw();

    await userEvent.click(await screen.findByRole('button', { name: 'Turn all on' }));

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledWith([]);
    });
  });

  it('puts the switch back where saving failed', async () => {
    saveHiddenAlerts.mockResolvedValue(false);

    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Low memory' }));

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'Low memory' })).toBeChecked();
    });
  });

  it('leaves out an alert the server no longer knows', async () => {
    server.held = ['retired-alert'];

    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Low memory' }));

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledWith(['memory']);
    });
  });

  it('leaves out the requests alerts where requesting is off', async () => {
    draw();

    expect(await screen.findByRole('switch', { name: 'Low memory' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'VPN down' })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Failing indexers' })).not.toBeInTheDocument();
  });

  it('offers the requests alerts where requesting is on', async () => {
    fetchRequestsAvailability.mockResolvedValue({ isEnabled: true });

    draw();

    expect(await screen.findByRole('switch', { name: 'VPN down' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Failing indexers' })).toBeInTheDocument();
  });

  it('saves one change after another, then reads back what the server holds', async () => {
    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Low memory' }));
    await userEvent.click(screen.getByRole('switch', { name: 'High CPU' }));

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenCalledTimes(2);
    });
    expect(saveHiddenAlerts).toHaveBeenNthCalledWith(1, ['memory']);
    expect(saveHiddenAlerts).toHaveBeenNthCalledWith(2, ['memory', 'cpu']);
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: 'High CPU' })).not.toBeChecked();
    });
    expect(screen.getByRole('switch', { name: 'Low memory' })).not.toBeChecked();
    expect(server.held).toEqual(['memory', 'cpu']);
  });

  it('holds a second change back until the first has been saved', async () => {
    let release = (_isSaved: boolean) => {};
    const held = new Promise<boolean>((resolve) => {
      release = resolve;
    });

    saveHiddenAlerts.mockImplementationOnce((next: readonly string[]) => {
      server.held = [...next];

      return held;
    });

    draw();

    await userEvent.click(await screen.findByRole('switch', { name: 'Low memory' }));
    await userEvent.click(screen.getByRole('switch', { name: 'High CPU' }));

    expect(saveHiddenAlerts).toHaveBeenCalledTimes(1);

    release(true);

    await waitFor(() => {
      expect(saveHiddenAlerts).toHaveBeenNthCalledWith(2, ['memory', 'cpu']);
    });
  });
});

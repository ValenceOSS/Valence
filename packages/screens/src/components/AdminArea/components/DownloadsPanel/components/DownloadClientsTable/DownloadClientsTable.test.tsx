import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DownloadClientsTable } from './DownloadClientsTable';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadClientState } from '@ValenceContracts/schemas/DownloadQueue';

const QBITTORRENT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Seedbox',
  kind: 'qbittorrent',
  url: 'http://seedbox:8080',
  username: 'admin',
  hasPassword: true,
  hasApiKey: false,
  category: 'valence',
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const SABNZBD: DownloadClient = {
  ...QBITTORRENT,
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  name: 'Usenet',
  kind: 'sabnzbd',
  isEnabled: false,
};

const READING: DownloadClientState = {
  id: QBITTORRENT.id,
  name: 'Seedbox',
  kind: 'qbittorrent',
  isEnabled: true,
  isReachable: true,
  problem: null,
  downloadBytesPerSecond: 1024 ** 2,
  uploadBytesPerSecond: 1024,
  checkedAt: '2026-09-19T00:00:00.000Z',
};

/**
 * The table over the clients and readings given.
 */
const show = (readings: DownloadClientState[] = [READING], testingId: string | null = null) => {
  const handlers = { onChange: vi.fn(), onTest: vi.fn(), onSwitch: vi.fn(), onRemove: vi.fn() };

  renderInAnAddress(
    <DownloadClientsTable
      clients={[QBITTORRENT, SABNZBD]}
      readings={readings}
      testingId={testingId}
      {...handlers}
    />,
  );

  return handlers;
};

/**
 * The row naming a client.
 */
const rowOf = (name: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(name)) ?? document.body;

describe('DownloadClientsTable', () => {
  it('shows what each client is, whether it answers, and how fast it is going', () => {
    show();

    const seedbox = within(rowOf('Seedbox'));

    expect(seedbox.getByText('qBittorrent')).toBeInTheDocument();
    expect(seedbox.getByText('http://seedbox:8080 · valence')).toBeInTheDocument();
    expect(seedbox.getByText('Answering')).toBeInTheDocument();
    expect(seedbox.getByText('↓ 1.0 MB/s · ↑ 1.0 KB/s')).toBeInTheDocument();
    expect(within(rowOf('Usenet')).getByText('Off')).toBeInTheDocument();
    expect(within(rowOf('Usenet')).getByText('SABnzbd')).toBeInTheDocument();
  });

  it('says why a client could not be reached, and shows no speed for it', () => {
    show([{ ...READING, isReachable: false, problem: 'Seedbox could not be reached' }]);

    const seedbox = within(rowOf('Seedbox'));

    expect(seedbox.getByText('Seedbox could not be reached')).toBeInTheDocument();
    expect(seedbox.getByText('—')).toBeInTheDocument();
  });

  it('shows a dash where a client answers but says nothing of its speed', () => {
    show([{ ...READING, downloadBytesPerSecond: null, uploadBytesPerSecond: null }]);

    expect(within(rowOf('Seedbox')).getByText('—')).toBeInTheDocument();
  });

  it('waits on a client being tested', () => {
    show([READING], QBITTORRENT.id);

    expect(screen.getByRole('status', { name: 'Testing Seedbox' })).toBeInTheDocument();
  });

  it('changes, tests, switches and removes a client', async () => {
    const user = userEvent.setup();
    const handlers = show();

    for (const [item, handler] of [
      [/Change/, handlers.onChange],
      [/Test/, handlers.onTest],
      [/Switch off/, handlers.onSwitch],
      [/Remove/, handlers.onRemove],
    ] as const) {
      await user.click(screen.getByRole('button', { name: 'Actions for Seedbox' }));
      await user.click(await screen.findByRole('menuitem', { name: item }));

      expect(handler).toHaveBeenCalledWith(QBITTORRENT);
    }

    await user.click(screen.getByRole('button', { name: 'Actions for Usenet' }));

    expect(await screen.findByRole('menuitem', { name: /Switch on/ })).toBeInTheDocument();
  });

  it('says what to add while there are none', () => {
    renderInAnAddress(
      <DownloadClientsTable
        clients={[]}
        readings={[]}
        testingId={null}
        onChange={vi.fn()}
        onTest={vi.fn()}
        onSwitch={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/No download clients yet/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadClientsTable.displayName).toBe('DownloadClientsTable');
  });
});

import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ArrAppsPanel } from './ArrAppsPanel';
import type { ArrApp } from '@ValenceContracts/schemas/ArrApp';
import type * as Apps from '@ValenceClient/requests/fetchArrApps';

const fetchArrApps = vi.fn<typeof Apps.fetchArrApps>();
const changeArrApp = vi.fn<typeof Apps.changeArrApp>();
const removeArrApp = vi.fn<typeof Apps.removeArrApp>();
const testArrApp = vi.fn<typeof Apps.testArrApp>();
const importArrIndexers = vi.fn<typeof Apps.importArrIndexers>();

vi.mock('@ValenceClient/requests/fetchArrApps', () => ({
  fetchArrApps: () => fetchArrApps(),
  fetchArrQueue: vi.fn(),
  fetchArrAppChoices: vi.fn(),
  addArrApp: vi.fn(),
  tryArrApp: vi.fn(),
  changeArrApp: (...given: Parameters<typeof Apps.changeArrApp>) => changeArrApp(...given),
  removeArrApp: (...given: Parameters<typeof Apps.removeArrApp>) => removeArrApp(...given),
  testArrApp: (...given: Parameters<typeof Apps.testArrApp>) => testArrApp(...given),
  importArrIndexers: (...given: Parameters<typeof Apps.importArrIndexers>) =>
    importArrIndexers(...given),
}));

/**
 * A connected app, with anything the test cares about changed.
 */
const anApp = (overrides: Partial<ArrApp> = {}): ArrApp => ({
  id: '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01',
  name: 'Films',
  kind: 'radarr',
  url: 'http://radarr:7878',
  hasApiKey: true,
  remotePath: '',
  localPath: '',
  isEnabled: true,
  isWorking: true,
  version: '5.14',
  lastCheckedAt: null,
  lastProblem: null,
  lastProblemCode: null,
  createdAt: '2026-09-30T00:00:00.000Z',
  updatedAt: '2026-09-30T00:00:00.000Z',
  ...overrides,
});

const PROWLARR = anApp({
  id: '5a1d2c3b-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
  name: 'Indexers',
  kind: 'prowlarr',
  isWorking: false,
  lastProblem: sayVerbatim('Indexers refused its API key'),
  lastProblemCode: 'ArrAppKeyRefused',
});

/**
 * Opens the actions for an app and picks one.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, name: string, action: string) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${name}` }));
  await user.click(await screen.findByRole('menuitem', { name: new RegExp(action) }));
};

beforeEach(() => {
  fetchArrApps.mockReset().mockResolvedValue([anApp(), PROWLARR]);
  changeArrApp.mockReset().mockResolvedValue({ value: anApp(), refusal: null });
  removeArrApp.mockReset().mockResolvedValue(null);
  testArrApp.mockReset().mockResolvedValue({
    value: { isWorking: true, problem: null, problemCode: null, version: '5.14' },
    refusal: null,
  });
  importArrIndexers.mockReset().mockResolvedValue({
    value: { added: 2, updated: 1, removed: 0, unchanged: 3 },
    refusal: null,
  });
});

describe('ArrAppsPanel', () => {
  it('lists each app, what it is and how it is', async () => {
    renderInAnAddress(<ArrAppsPanel />);

    expect(await screen.findByText('Films')).toBeInTheDocument();
    expect(screen.getByText('Radarr')).toBeInTheDocument();
    expect(screen.getByText('Version 5.14')).toBeInTheDocument();
    expect(screen.getByText('Indexers refused its API key')).toBeInTheDocument();
  });

  it('says there are none yet, and could not be read', async () => {
    fetchArrApps.mockResolvedValue([]);

    renderInAnAddress(<ArrAppsPanel />);

    expect(await screen.findByText(/None yet/)).toBeInTheDocument();
  });

  it('opens the dialog to connect one, or to change one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ArrAppsPanel />);

    await user.click(screen.getByRole('button', { name: 'Connect an app' }));

    expect(await screen.findByRole('dialog', { name: 'Connect an app' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await choose(user, 'Films', 'Change');

    expect(await screen.findByRole('dialog', { name: 'Change Films' })).toBeInTheDocument();
  });

  it('tests an app, and says why one did not answer', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ArrAppsPanel />);

    await choose(user, 'Films', 'Test');

    await waitFor(() => {
      expect(testArrApp).toHaveBeenCalledWith(anApp().id);
    });

    testArrApp.mockResolvedValue({
      value: { isWorking: false, problem: null, problemCode: null, version: null },
      refusal: null,
    });
    await choose(user, 'Films', 'Test');

    expect(await screen.findByRole('alert')).toHaveTextContent('Films: It did not answer');
  });

  it('brings in a Prowlarr’s indexers, offering it only for Prowlarr', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ArrAppsPanel />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Films' }));

    expect(
      screen.queryByRole('menuitem', { name: /Import from Prowlarr/ }),
    ).not.toBeInTheDocument();

    await user.keyboard('{Escape}');
    await choose(user, 'Indexers', 'Import from Prowlarr');

    await waitFor(() => {
      expect(importArrIndexers).toHaveBeenCalledWith(PROWLARR.id);
    });
  });

  it('switches an app off', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ArrAppsPanel />);

    await choose(user, 'Films', 'Switch off');

    await waitFor(() => {
      expect(changeArrApp).toHaveBeenCalledWith(anApp().id, { isEnabled: false });
    });
  });

  it('disconnects an app once asked, warning a Prowlarr’s indexers go with it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ArrAppsPanel />);

    await choose(user, 'Indexers', 'Disconnect');

    expect(await screen.findByText(/The indexers it brought in are removed/)).toBeInTheDocument();
    expect(removeArrApp).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(removeArrApp).toHaveBeenCalledWith(PROWLARR.id);
    });
  });
});

import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_WORK, SOLVER_NOT_USED } from '@ValenceContracts/schemas/Requests';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestsPanel } from './RequestsPanel';
import type { RequestsOverview } from '@ValenceContracts/schemas/Requests';

const fetchRequestsOverview = vi.fn<() => Promise<RequestsOverview>>();
const checkRequestsNow = vi.fn<() => Promise<RequestsOverview>>();

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsOverview: () => fetchRequestsOverview(),
  checkRequestsNow: () => checkRequestsNow(),
}));

const ANSWERING: RequestsOverview = {
  address: 'http://requests:8421',
  isReachable: true,
  problem: null,
  problemCode: null,
  checkedAt: '2026-09-19T12:00:00.000Z',
  status: {
    version: '0.4.0',
    vpn: {
      isConfigured: true,
      isUp: true,
      publicAddress: '203.0.113.7',
      country: 'Netherlands',
      checkedAt: '2026-09-19T12:00:00.000Z',
      problem: null,
      problemCode: null,
    },
    indexers: { total: 0, enabled: 0, failing: [] },
    solver: SOLVER_NOT_USED,
  },
  work: NO_WORK,
};

const NOT_CHECKED_VPN = {
  isConfigured: false,
  isUp: null,
  publicAddress: null,
  country: null,
  checkedAt: null,
  problem: null,
  problemCode: null,
};

const NOT_CHECKED: RequestsOverview = {
  address: 'http://requests:8421',
  isReachable: false,
  problem: null,
  problemCode: null,
  checkedAt: null,
  status: null,
  work: NO_WORK,
};

beforeEach(() => {
  fetchRequestsOverview.mockReset().mockResolvedValue(ANSWERING);
  checkRequestsNow.mockReset().mockResolvedValue(ANSWERING);
});

describe('RequestsPanel', () => {
  it('says the service is answering, and which release it is', async () => {
    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findAllByText('Online')).toHaveLength(2);
    expect(screen.getByText('0.4.0')).toBeInTheDocument();
  });

  it('says the VPN is up, and where traffic leaves from', async () => {
    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('Up')).toBeInTheDocument();
    expect(screen.getByText(/traffic leaves from 203\.0\.113\.7, Netherlands/)).toBeInTheDocument();
  });

  it('says so when the service could not be reached', async () => {
    fetchRequestsOverview.mockResolvedValue({ ...NOT_CHECKED, checkedAt: ANSWERING.checkedAt });

    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('Unreachable')).toBeInTheDocument();
    expect(screen.getAllByText('Not checked')).toHaveLength(2);
  });

  it('says the service has not been checked yet, rather than calling it unreachable', async () => {
    fetchRequestsOverview.mockResolvedValue(NOT_CHECKED);

    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findAllByText('Not checked')).toHaveLength(3);
    expect(screen.getByText(/Expected at http:\/\/requests:8421/)).toBeInTheDocument();
  });

  it('asks again on demand, and shows what it heard', async () => {
    fetchRequestsOverview.mockResolvedValue(NOT_CHECKED);

    const user = userEvent.setup();

    renderInAnAddress(<RequestsPanel />);

    await screen.findAllByText('Not checked');
    await user.click(screen.getByRole('button', { name: 'Check now' }));

    expect(await screen.findAllByText('Online')).toHaveLength(2);
    expect(checkRequestsNow).toHaveBeenCalledTimes(1);
  });

  it('reads again where asking on demand failed', async () => {
    checkRequestsNow.mockRejectedValue(new Error('refused'));

    const user = userEvent.setup();

    renderInAnAddress(<RequestsPanel />);

    await screen.findAllByText('Online');
    await user.click(screen.getByRole('button', { name: 'Check now' }));

    await waitFor(() => {
      expect(fetchRequestsOverview).toHaveBeenCalledTimes(2);
    });
  });

  it('says it could not read the service, and offers to try again', async () => {
    fetchRequestsOverview.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('says there are no indexers yet, and where to add one', async () => {
    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText(/None yet. Add one on the Indexers page/)).toBeInTheDocument();
  });

  it('says how many indexers are on, and which are failing', async () => {
    fetchRequestsOverview.mockResolvedValue({
      ...ANSWERING,
      status: {
        version: '0.4.0',
        vpn: ANSWERING.status?.vpn ?? NOT_CHECKED_VPN,
        indexers: {
          total: 3,
          enabled: 2,
          failing: [
            {
              id: '0f8fad5b-d9cb-469f-a165-70867728950e',
              name: 'Jackett',
              problem: sayVerbatim('Timed out'),
              problemCode: null,
            },
          ],
        },
        solver: SOLVER_NOT_USED,
      },
    });

    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('1 failing')).toBeInTheDocument();
    expect(screen.getByText('2 of 3 enabled. Jackett: Timed out')).toBeInTheDocument();
  });

  it('links one failing indexer to its own fix, and several to the general one', async () => {
    const failing = (...codes: ('CloudflareRefusesAddress' | 'DownloadClientUnreachable')[]) => ({
      ...ANSWERING,
      status: {
        version: '0.4.0',
        vpn: ANSWERING.status?.vpn ?? NOT_CHECKED_VPN,
        indexers: {
          total: 3,
          enabled: 3,
          failing: codes.map((code, at) => ({
            id: `0f8fad5b-d9cb-469f-a165-7086772895${at.toString().padStart(2, '0')}`,
            name: `Indexer ${at.toString()}`,
            problem: sayVerbatim('It went wrong'),
            problemCode: code,
          })),
        },
        solver: SOLVER_NOT_USED,
      },
    });

    fetchRequestsOverview.mockResolvedValue(failing('CloudflareRefusesAddress'));

    const one = renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('1 failing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How to fix this' })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/install/requesting#a-sites-cloudflare-refuses-your-address',
    );

    one.unmount();
    fetchRequestsOverview.mockResolvedValue(
      failing('CloudflareRefusesAddress', 'DownloadClientUnreachable'),
    );
    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('2 failing')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'How to fix this' })).not.toBeInTheDocument();
  });

  it('says every indexer is working where none are failing', async () => {
    fetchRequestsOverview.mockResolvedValue({
      ...ANSWERING,
      status: {
        version: '0.4.0',
        vpn: ANSWERING.status?.vpn ?? NOT_CHECKED_VPN,
        indexers: { total: 1, enabled: 1, failing: [] },
        solver: SOLVER_NOT_USED,
      },
    });

    renderInAnAddress(<RequestsPanel />);

    const indexers = (await screen.findByText('Indexers')).closest<HTMLElement>(
      '[data-slot="setting-row"]',
    );

    expect(indexers).not.toBeNull();
    expect(within(indexers ?? document.body).getByText('Working')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RequestsPanel.displayName).toBe('RequestsPanel');
  });
});

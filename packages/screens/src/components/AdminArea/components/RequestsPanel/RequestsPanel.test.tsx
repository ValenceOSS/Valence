import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    },
  },
};

const NOT_CHECKED: RequestsOverview = {
  address: 'http://requests:8421',
  isReachable: false,
  checkedAt: null,
  status: null,
};

beforeEach(() => {
  fetchRequestsOverview.mockReset().mockResolvedValue(ANSWERING);
  checkRequestsNow.mockReset().mockResolvedValue(ANSWERING);
});

describe('RequestsPanel', () => {
  it('says the service is answering, and which release it is', async () => {
    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('Answering')).toBeInTheDocument();
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
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('says the service has not been checked yet, rather than calling it unreachable', async () => {
    fetchRequestsOverview.mockResolvedValue(NOT_CHECKED);

    renderInAnAddress(<RequestsPanel />);

    expect(await screen.findByText('Not checked')).toBeInTheDocument();
    expect(screen.getByText(/Looking for it at http:\/\/requests:8421/)).toBeInTheDocument();
  });

  it('asks again on demand, and shows what it heard', async () => {
    fetchRequestsOverview.mockResolvedValue(NOT_CHECKED);

    const user = userEvent.setup();

    renderInAnAddress(<RequestsPanel />);

    await screen.findByText('Not checked');
    await user.click(screen.getByRole('button', { name: 'Check now' }));

    expect(await screen.findByText('Answering')).toBeInTheDocument();
    expect(checkRequestsNow).toHaveBeenCalledTimes(1);
  });

  it('reads again where asking on demand failed', async () => {
    checkRequestsNow.mockRejectedValue(new Error('refused'));

    const user = userEvent.setup();

    renderInAnAddress(<RequestsPanel />);

    await screen.findByText('Answering');
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

  it('sets a display name so devtools can identify it', () => {
    expect(RequestsPanel.displayName).toBe('RequestsPanel');
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { SeerrCard } from './SeerrCard';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { SeerrLink, SeerrLinkChange } from '@ValenceContracts/schemas/SeerrLink';

const fetchSeerrLink = vi.fn<() => Promise<SeerrLink>>();
const changeSeerrLink = vi.fn<(change: SeerrLinkChange) => Promise<Sent<SeerrLink>>>();
const rotateSeerrKey = vi.fn<() => Promise<Sent<SeerrLink>>>();

vi.mock('@ValenceClient/requests/fetchSeerrLink', () => ({
  fetchSeerrLink: () => fetchSeerrLink(),
}));

vi.mock('@ValenceClient/requests/changeSeerrLink', () => ({
  changeSeerrLink: (change: SeerrLinkChange) => changeSeerrLink(change),
}));

vi.mock('@ValenceClient/requests/rotateSeerrKey', () => ({
  rotateSeerrKey: () => rotateSeerrKey(),
}));

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({
  fetchAccounts: () =>
    Promise.resolve([
      {
        id: 'a1',
        name: 'Requests from Seerr',
        email: 'seerr@example.test',
        createdAt: '2026-10-01T00:00:00.000Z',
        isBanned: false,
        banReason: null,
        position: null,
        isAdministrator: false,
        face: null,
        roles: [],
      },
    ]),
}));

const OFF: SeerrLink = {
  isEnabled: false,
  apiKey: '',
  accountId: '',
  isRequestingOn: true,
  radarrPath: '/arr/radarr',
  sonarrPath: '/arr/sonarr',
};

const ON: SeerrLink = {
  ...OFF,
  isEnabled: true,
  apiKey: '0123456789abcdef0123456789abcdef',
  accountId: 'a1',
};

beforeEach(() => {
  fetchSeerrLink.mockReset().mockResolvedValue(ON);
  changeSeerrLink.mockReset().mockResolvedValue({ value: ON, refusal: null });
  rotateSeerrKey
    .mockReset()
    .mockResolvedValue({
      value: { ...ON, apiKey: 'fedcba9876543210fedcba9876543210' },
      refusal: null,
    });
});

describe('SeerrCard', () => {
  it('gives the key and exactly what to type into the Radarr and Sonarr dialogs', async () => {
    renderInAnAddress(<SeerrCard origin="http://192.168.1.20:8420" />);

    expect(await screen.findByText(ON.apiKey)).toBeInTheDocument();
    expect(screen.getByText('http://192.168.1.20:8420/arr/radarr')).toBeInTheDocument();
    expect(screen.getByText('http://192.168.1.20:8420/arr/sonarr')).toBeInTheDocument();
    expect(
      screen.getByText('Hostname 192.168.1.20, port 8420, Use SSL Off, URL Base /arr/radarr.'),
    ).toBeInTheDocument();
  });

  it('turns answering them on, keeping the account chosen', async () => {
    fetchSeerrLink.mockResolvedValue(OFF);
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    await userEvent.click(
      await screen.findByRole('switch', { name: 'Answer Overseerr and Jellyseerr' }),
    );

    await waitFor(() => {
      expect(changeSeerrLink).toHaveBeenCalledWith({ isEnabled: true, accountId: '' });
    });
  });

  it('shows no key or addresses while it is off', async () => {
    fetchSeerrLink.mockResolvedValue(OFF);
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    expect(
      await screen.findByRole('switch', { name: 'Answer Overseerr and Jellyseerr' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('http://valence.local/arr/radarr')).not.toBeInTheDocument();
  });

  it('says to choose an account while none is chosen', async () => {
    fetchSeerrLink.mockResolvedValue({ ...ON, accountId: '' });
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    expect(
      await screen.findByText(
        'Choose an account to ask as. Until you do, what they send is turned away.',
      ),
    ).toBeInTheDocument();
  });

  it('makes a new key on asking, and shows it', async () => {
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    await userEvent.click(await screen.findByRole('button', { name: /Make a new key/ }));

    expect(await screen.findByText('fedcba9876543210fedcba9876543210')).toBeInTheDocument();
  });

  it('explains that requesting has to be set up first', async () => {
    fetchSeerrLink.mockResolvedValue({ ...OFF, isRequestingOn: false });
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    expect(await screen.findByText(/Requesting is off on this server/)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });

  it('says when the link could not be read', async () => {
    fetchSeerrLink.mockRejectedValue(new Error('offline'));
    renderInAnAddress(<SeerrCard origin="http://valence.local" />);

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(
      screen.getByText(/The link to Overseerr and Jellyseerr could not be read\./),
    ).toBeInTheDocument();
  });
});

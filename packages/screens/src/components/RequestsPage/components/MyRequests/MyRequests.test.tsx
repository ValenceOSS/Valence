import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { MyRequests } from './MyRequests';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type * as Askable from '@ValenceClient/requests/fetchAskable';

const fetchMediaRequests = vi.fn<typeof Requests.fetchMediaRequests>();
const removeMediaRequest = vi.fn<typeof Requests.removeMediaRequest>();
const fetchRequestProgress = vi.fn<typeof Askable.fetchRequestProgress>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests: () => fetchMediaRequests(),
  removeMediaRequest: (...given: Parameters<typeof Requests.removeMediaRequest>) =>
    removeMediaRequest(...given),
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchRequestProgress: () => fetchRequestProgress(),
}));

vi.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () =>
    Promise.resolve({ id: 'me', name: 'Ada', email: 'ada@valence.test', image: null }),
}));

const MINE = aMediaRequest({ requestedBy: { id: 'me', name: 'Ada' } });

beforeEach(() => {
  fetchMediaRequests
    .mockReset()
    .mockResolvedValue([MINE, aMediaRequest({ id: 'somebody-elses', title: 'Arrival' })]);
  removeMediaRequest.mockReset().mockResolvedValue(null);
  fetchRequestProgress.mockReset().mockResolvedValue([]);
});

describe('MyRequests', () => {
  it('shows your own requests and nobody else’s', async () => {
    renderInAnAddress(<MyRequests onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Dune (2021)')).toBeInTheDocument();
    expect(screen.queryByText('Arrival (2021)')).not.toBeInTheDocument();
  });

  it('cancels a request once, deleting whatever it had started downloading', async () => {
    renderInAnAddress(<MyRequests onAsk={vi.fn()} onOpen={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request' }));

    await waitFor(() => {
      expect(removeMediaRequest).toHaveBeenCalledWith(MINE.id, true);
    });
  });

  it('opens what has arrived, and the page of what has not', async () => {
    const handlers = { onAsk: vi.fn(), onOpen: vi.fn() };

    fetchMediaRequests.mockResolvedValue([
      { ...MINE, state: 'available', mediaId: 'media-1' },
      { ...MINE, id: 'still-coming', title: 'Arrival' },
    ]);

    renderInAnAddress(<MyRequests {...handlers} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(handlers.onOpen).toHaveBeenCalledWith('film', 'media-1');

    await userEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(handlers.onAsk).toHaveBeenCalledWith('film:438631');
  });

  it('says so where you have asked for nothing', async () => {
    fetchMediaRequests.mockResolvedValue([]);

    renderInAnAddress(<MyRequests onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('You have not asked for anything yet')).toBeInTheDocument();
  });
});

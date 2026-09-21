import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestsList } from './RequestsList';
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

vi.mock('@ValenceClient/library/fetchLibrary', async (actual) => ({
  ...(await actual<object>()),
  fetchLibraries: () =>
    Promise.resolve([
      { id: 'films', name: 'Films', kind: 'movies', path: '/media/films', itemCount: 0 },
      { id: 'shows', name: 'Shows', kind: 'shows', path: '/media/shows', itemCount: 0 },
    ]),
}));

const MINE = aMediaRequest({ requestedBy: { id: 'me', name: 'Ada' } });

const THEIRS = aMediaRequest({
  id: 'somebody-elses',
  title: 'Arrival',
  requestedBy: { id: 'sam', name: 'Sam' },
});

beforeEach(() => {
  fetchMediaRequests.mockReset().mockResolvedValue([MINE, THEIRS]);
  removeMediaRequest.mockReset().mockResolvedValue(null);
  fetchRequestProgress.mockReset().mockResolvedValue([]);
});

describe('RequestsList', () => {
  it('shows every request the server sent, not only your own', async () => {
    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Dune (2021)')).toBeInTheDocument();
    expect(screen.getByText('Arrival (2021)')).toBeInTheDocument();
  });

  it('says who asked, which library it is for, and the quality it is judged at', async () => {
    fetchMediaRequests.mockResolvedValue([{ ...THEIRS, libraryId: 'films', profileName: '4K' }]);

    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Asked by Sam · Films · 4K')).toBeInTheDocument();
  });

  it('says a request of your own is yours rather than naming you', async () => {
    fetchMediaRequests.mockResolvedValue([{ ...MINE, libraryId: 'films', profileName: null }]);

    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Asked by you · Films')).toBeInTheDocument();
  });

  it('narrows the list to one person’s requests', async () => {
    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Filter the requests' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Sam' }));

    expect(screen.getByText('Arrival (2021)')).toBeInTheDocument();
    expect(screen.queryByText('Dune (2021)')).not.toBeInTheDocument();
  });

  it('narrows the list by what is typed', async () => {
    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Search the requests' }),
      'arriv',
    );

    await waitFor(() => {
      expect(screen.queryByText('Dune (2021)')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Arrival (2021)')).toBeInTheDocument();
  });

  it('says so where nothing matches what was asked of it', async () => {
    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    await userEvent.type(
      await screen.findByRole('searchbox', { name: 'Search the requests' }),
      'nothing like this',
    );

    expect(await screen.findByText('Nothing matches that')).toBeInTheDocument();
  });

  it('offers to cancel only the requests that are yours', async () => {
    fetchMediaRequests.mockResolvedValue([THEIRS]);

    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Arrival (2021)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('cancels a request once, deleting whatever it had started downloading', async () => {
    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

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

    renderInAnAddress(<RequestsList {...handlers} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Open' }));

    expect(handlers.onOpen).toHaveBeenCalledWith('film', 'media-1');

    await userEvent.click(screen.getByRole('button', { name: 'Details' }));

    expect(handlers.onAsk).toHaveBeenCalledWith('film:438631');
  });

  it('says so where nothing has been asked for at all', async () => {
    fetchMediaRequests.mockResolvedValue([]);

    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Nothing has been asked for yet')).toBeInTheDocument();
  });

  it('says why a request of yours was refused', async () => {
    fetchMediaRequests.mockResolvedValue([
      {
        ...MINE,
        approval: 'refused',
        state: 'awaitingApproval',
        refusedBecause: 'There is no room for it',
      },
    ]);

    renderInAnAddress(<RequestsList onAsk={vi.fn()} onOpen={vi.fn()} />);

    expect(await screen.findByText('Refused: There is no room for it')).toBeInTheDocument();
  });
});

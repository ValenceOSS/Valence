import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { MediaRequestsPanel } from './MediaRequestsPanel';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const fetchMediaRequests = vi.fn<typeof Requests.fetchMediaRequests>();
const approveMediaRequest = vi.fn<typeof Requests.approveMediaRequest>();
const retryMediaRequest = vi.fn<typeof Requests.retryMediaRequest>();
const fulfilMediaRequest = vi.fn<typeof Requests.fulfilMediaRequest>();
const removeMediaRequest = vi.fn<typeof Requests.removeMediaRequest>();
const searchMissing = vi.fn<typeof Requests.searchMissing>();
const fetchMediaRequestReleases = vi.fn<typeof Requests.fetchMediaRequestReleases>();
const fetchMediaRequestLog = vi.fn<typeof Requests.fetchMediaRequestLog>();
const changeMediaRequest = vi.fn<typeof Requests.changeMediaRequest>();
const decideMediaRequests = vi.fn<typeof Requests.decideMediaRequests>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests: () => fetchMediaRequests(),
  approveMediaRequest: (id: string) => approveMediaRequest(id),
  retryMediaRequest: (id: string) => retryMediaRequest(id),
  fulfilMediaRequest: (id: string) => fulfilMediaRequest(id),
  removeMediaRequest: (id: string) => removeMediaRequest(id),
  searchMissing: () => searchMissing(),
  fetchMediaRequestReleases: (id: string) => fetchMediaRequestReleases(id),
  fetchMediaRequestLog: (id: string) => fetchMediaRequestLog(id),
  changeMediaRequest: (...given: Parameters<typeof Requests.changeMediaRequest>) =>
    changeMediaRequest(...given),
  askForMedia: vi.fn(),
  refuseMediaRequest: vi.fn(),
  pickMediaRelease: vi.fn(),
  decideMediaRequests: (...given: Parameters<typeof Requests.decideMediaRequests>) =>
    decideMediaRequests(...given),
  fetchRequestBlocklist: () => Promise.resolve([]),
  liftRequestBlock: vi.fn(),
}));

const DUNE = aMediaRequest({ approval: 'awaiting', state: 'awaitingApproval' });

const SEVERANCE = aMediaRequest({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  kind: 'series',
  title: 'Severance',
  year: 2022,
  posterUrl: 'https://image.tmdb.org/t/p/w342/severance.jpg',
  state: 'downloading',
  seasons: [1],
  items: [
    {
      id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
      musicBrainzId: null,
      season: 1,
      episode: 1,
      title: 'Good News About Hell',
      airDate: '2022-02-18',
      state: 'downloading',
      problem: null,
      releaseTitle: 'Severance.S01E01.1080p.WEB-DL',
      downloadId: null,
      filePath: null,
      score: null,
      downloadedBytes: null,
      downloadSeconds: null,
      lastSearchedAt: null,
      updatedAt: '2026-09-19T00:00:00.000Z',
    },
  ],
});

beforeEach(() => {
  fetchMediaRequests.mockReset().mockResolvedValue([DUNE, SEVERANCE]);
  approveMediaRequest.mockReset().mockResolvedValue({ value: DUNE, refusal: null });
  retryMediaRequest.mockReset().mockResolvedValue({ value: DUNE, refusal: null });
  fulfilMediaRequest.mockReset().mockResolvedValue({ value: DUNE, refusal: null });
  removeMediaRequest.mockReset().mockResolvedValue(null);
  searchMissing.mockReset().mockResolvedValue({
    value: { searched: 2, startedAt: '2026-09-19T00:00:00.000Z' },
    refusal: null,
  });
  fetchMediaRequestReleases
    .mockReset()
    .mockResolvedValue({ releases: [], indexers: [], judgements: [], pickedId: null });
  decideMediaRequests
    .mockReset()
    .mockResolvedValue({ value: { decided: [DUNE], refused: [] }, refusal: null });
});

/**
 * The row naming a request.
 */
const rowOf = (title: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(title)) ?? document.body;

/**
 * Chooses one of a request's actions.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, title: string, action: RegExp) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${title}` }));
  await user.click(await screen.findByRole('menuitem', { name: action }));
};

describe('MediaRequestsPanel', () => {
  it('lists every request, where it is, and who asked', async () => {
    renderInAnAddress(<MediaRequestsPanel />);

    await screen.findByText('Dune (2021)');

    expect(within(rowOf('Dune')).getByText('Awaiting approval')).toBeInTheDocument();
    expect(within(rowOf('Dune')).getByText('Asked for by Sam')).toBeInTheDocument();
    expect(within(rowOf('Severance')).getByText('Downloading')).toBeInTheDocument();
    expect(
      within(rowOf('Severance')).getByText('Severance.S01E01.1080p.WEB-DL'),
    ).toBeInTheDocument();
    expect(
      within(rowOf('Severance')).getByText('Season 1 · 0 of 1 episode here · 1 downloading'),
    ).toBeInTheDocument();
  });

  it('narrows the list to the kinds ticked in the filter, which says how many are', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await screen.findByText('Dune (2021)');
    await user.click(screen.getByRole('button', { name: 'Filter the requests' }));
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Series' }));

    expect(screen.queryByText('Dune (2021)')).not.toBeInTheDocument();
    expect(screen.getByText('Severance (2022)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filter the requests' })).toHaveTextContent('1');
  });

  it('narrows the list to what was searched for, and says so when nothing matches', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await screen.findByText('Dune (2021)');
    await user.type(screen.getByRole('searchbox', { name: 'Search the requests' }), 'sever');

    expect(screen.queryByText('Dune (2021)')).not.toBeInTheDocument();
    expect(screen.getByText('Severance (2022)')).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search the requests' }), 'zzz');

    expect(screen.getByText(/Nothing matches/)).toBeInTheDocument();
  });

  it('approves a request waiting on approval, having looked it over', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Dune', /Approve/);

    expect(await screen.findByText('Approve Dune?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(approveMediaRequest).toHaveBeenCalledWith(DUNE.id);
    });
    await waitFor(() => {
      expect(fetchMediaRequests).toHaveBeenCalledTimes(2);
    });
  });

  it('approves everything chosen in one go', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await user.click(await screen.findByRole('checkbox', { name: 'Choose Dune' }));

    expect(screen.getByText('1 chosen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Approve them' }));

    await waitFor(() => {
      expect(decideMediaRequests).toHaveBeenCalledWith([DUNE.id], 'approve', '');
    });
    expect(await screen.findByText('1 approved.')).toBeInTheDocument();
  });

  it('refuses everything chosen with one reason between them', async () => {
    const user = userEvent.setup();

    fetchMediaRequests.mockResolvedValue([
      DUNE,
      { ...SEVERANCE, approval: 'awaiting', state: 'awaitingApproval' },
    ]);

    renderInAnAddress(<MediaRequestsPanel />);

    await user.click(
      await screen.findByRole('checkbox', { name: 'Choose all 2 waiting on approval' }),
    );

    expect(screen.getByText('2 chosen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Refuse them' }));
    await user.type(await screen.findByRole('textbox', { name: 'Why' }), 'No room');
    await user.click(screen.getByRole('button', { name: 'Refuse' }));

    await waitFor(() => {
      expect(decideMediaRequests).toHaveBeenCalledWith(
        [DUNE.id, SEVERANCE.id],
        'refuse',
        'No room',
      );
    });
  });

  it('switches a request between fetching the best by itself and only what is picked', async () => {
    const user = userEvent.setup();

    changeMediaRequest.mockResolvedValue({ value: DUNE, refusal: null });
    fetchMediaRequests.mockResolvedValue([aMediaRequest({ isPickedByHand: true })]);
    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Dune', /Fetch the best by itself/);

    await waitFor(() => {
      expect(changeMediaRequest).toHaveBeenCalledWith(DUNE.id, { isPickedByHand: false });
    });
  });

  it('says a request has been met by hand, as for a book added to the library', async () => {
    const user = userEvent.setup();
    const book = aMediaRequest({
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c7',
      kind: 'book',
      tmdbId: null,
      openLibraryId: 21_277_329,
      title: 'Project Hail Mary',
      state: 'waiting',
    });

    fetchMediaRequests.mockResolvedValue([book]);
    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Project Hail Mary', /Mark as added/);

    await waitFor(() => {
      expect(fulfilMediaRequest).toHaveBeenCalledWith(book.id);
    });
  });

  it('does not offer to search again for a book, since a book is never searched for', async () => {
    const user = userEvent.setup();

    fetchMediaRequests.mockResolvedValue([
      aMediaRequest({
        kind: 'book',
        tmdbId: null,
        openLibraryId: 5,
        title: 'Emma',
        state: 'waiting',
      }),
    ]);
    renderInAnAddress(<MediaRequestsPanel />);

    await user.click(await screen.findByRole('button', { name: 'Actions for Emma' }));

    expect(await screen.findByRole('menuitem', { name: /Search again now/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('says why an action was refused', async () => {
    const user = userEvent.setup();

    fetchMediaRequests.mockResolvedValue([aMediaRequest()]);
    retryMediaRequest.mockResolvedValue({
      value: null,
      refusal: { message: 'Requesting is off.' },
    });
    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Dune', /Search again now/);

    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');
  });

  it('opens the dialogs to refuse, to pick a release, and to ask for something', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Dune', /Refuse/);
    expect(await screen.findByText('Refuse Dune?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await choose(user, 'Severance', /Pick a release/);
    expect(await screen.findByRole('tab', { name: 'Releases' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await waitFor(() => {
      expect(fetchMediaRequestReleases).toHaveBeenCalledWith(SEVERANCE.id);
    });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    fetchMediaRequestLog.mockResolvedValue([
      { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched for it.' },
    ]);
    await choose(user, 'Dune', /See what it has done/);
    expect(await screen.findByText('Searched for it.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await user.click(screen.getByRole('button', { name: 'Request media' }));
    expect(await screen.findByRole('textbox', { name: 'Search for a film' })).toBeInTheDocument();
  });

  it('forgets a request once that is confirmed', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await choose(user, 'Dune', /Forget/);
    await user.click(await screen.findByRole('button', { name: 'Forget' }));

    await waitFor(() => {
      expect(removeMediaRequest).toHaveBeenCalledWith(DUNE.id);
    });
  });

  it('searches for everything missing, and says how many', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<MediaRequestsPanel />);

    await user.click(screen.getByRole('button', { name: 'Refetch media' }));

    expect(await screen.findByRole('status', { name: '' })).toHaveTextContent(
      'Searched again for 2 requests.',
    );

    searchMissing.mockResolvedValue({ value: { searched: 0, startedAt: '' }, refusal: null });
    await user.click(screen.getByRole('button', { name: 'Refetch media' }));
    expect(await screen.findByText('Nothing is missing.')).toBeInTheDocument();

    searchMissing.mockResolvedValue({ value: null, refusal: { message: 'Requesting is off.' } });
    await user.click(screen.getByRole('button', { name: 'Refetch media' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Requesting is off.');
  });

  it('says it could not read the requests, and what to do while there are none', async () => {
    const user = userEvent.setup();

    fetchMediaRequests.mockRejectedValueOnce(new Error('offline')).mockResolvedValue([]);
    renderInAnAddress(<MediaRequestsPanel />);

    await user.click(await screen.findByRole('button', { name: /try again/i }));

    expect(await screen.findByText(/Nothing has been asked for yet/)).toBeInTheDocument();
  });
});

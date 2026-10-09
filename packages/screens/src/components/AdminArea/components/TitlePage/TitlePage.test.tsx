import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { TitlePage } from './TitlePage';
import type { CatalogueEntry } from '@ValenceContracts/schemas/AdminCatalogue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const catalogue = vi.hoisted((): { entries: CatalogueEntry[] } => ({ entries: [] }));
const requested = vi.hoisted((): { requests: MediaRequest[] } => ({ requests: [] }));
const admin = vi.hoisted(() => ({ controlsConnectedApps: false }));
const approveMediaRequest = vi.fn<typeof Requests.approveMediaRequest>();
const askForMedia = vi.fn<typeof Requests.askForMedia>();
const changeMediaRequest = vi.fn<typeof Requests.changeMediaRequest>();
const followRequestItems = vi.fn<typeof Requests.followRequestItems>();
const removeMediaRequest = vi.fn<typeof Requests.removeMediaRequest>();
const stopRequestDownload = vi.fn<typeof Requests.stopRequestDownload>();

vi.mock('@ValenceClient/requests/fetchTitleCatalogue', () => ({
  fetchTitleCatalogue: () => Promise.resolve(catalogue.entries),
  fetchTitleFiles: () => Promise.resolve({ folder: '/media/Shows/Show', files: [] }),
}));

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequests: () => Promise.resolve(requested.requests),
  fetchSeriesSeasons: () =>
    Promise.resolve([
      { season: 1, episodeCount: 2, firstAired: null, standing: 'askable' },
      { season: 2, episodeCount: 1, firstAired: null, standing: 'askable' },
    ]),
  fetchMediaRequestLog: () => Promise.resolve([]),
  fetchRequestBlocklist: () => Promise.resolve([]),
  fetchMediaRequestReleases: () => new Promise(() => undefined),
  fetchHandedTo: () =>
    Promise.resolve({
      appId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      appName: 'Radarr',
      appKind: 'radarr',
      link: null,
    }),
  fetchHandOffDownloads: () =>
    Promise.resolve([
      {
        id: '5',
        releaseTitle: 'Dune.2021.1080p.BluRay',
        itemIds: ['0b1d2c3e-4f56-4a78-9b01-23456789abcd'],
        clientName: 'qBittorrent',
        progress: 0.5,
        sizeBytes: 1000,
        secondsLeft: null,
        problem: null,
      },
    ]),
  approveMediaRequest: (id: string) => approveMediaRequest(id),
  askForMedia: (...given: Parameters<typeof Requests.askForMedia>) => askForMedia(...given),
  changeMediaRequest: (...given: Parameters<typeof Requests.changeMediaRequest>) =>
    changeMediaRequest(...given),
  followRequestItems: (...given: Parameters<typeof Requests.followRequestItems>) =>
    followRequestItems(...given),
  removeMediaRequest: (...given: Parameters<typeof Requests.removeMediaRequest>) =>
    removeMediaRequest(...given),
  stopRequestDownload: (...given: Parameters<typeof Requests.stopRequestDownload>) =>
    stopRequestDownload(...given),
  retryMediaRequest: vi.fn(),
  fulfilMediaRequest: vi.fn(),
  liftRequestBlock: vi.fn(),
  pickMediaRelease: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchAccounts', () => ({
  fetchAccounts: () => Promise.resolve([]),
}));

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  fetchAdminOverview: () =>
    Promise.resolve({ settings: { controlsConnectedApps: admin.controlsConnectedApps } }),
}));

vi.mock('@ValenceClient/requests/fetchAskable', () => ({
  fetchAskable: () =>
    Promise.resolve({
      kind: 'series',
      id: '42',
      title: 'Show',
      subtitle: null,
      year: 2019,
      overview: 'What it is about.',
      posterUrl: null,
      standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
      musicBrainzId: null,
      backdropUrl: null,
      genres: ['Drama'],
      runtimeMinutes: null,
      cast: [],
      albums: [],
      authors: [],
      trailerKey: null,
    }),
}));

vi.mock('@ValenceClient/requests/fetchDownloadQueue', () => ({
  fetchDownloadQueue: () => Promise.resolve({ clients: [], downloads: [], checkedAt: null }),
  watchDownloadQueue: () => () => undefined,
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => Promise.resolve([]),
}));

const ANSWERED = { value: aMediaRequest(), refusal: null };

beforeEach(() => {
  catalogue.entries = [];
  requested.requests = [];
  admin.controlsConnectedApps = false;
  approveMediaRequest.mockReset().mockResolvedValue(ANSWERED);
  askForMedia.mockReset().mockResolvedValue(ANSWERED);
  changeMediaRequest.mockReset().mockResolvedValue(ANSWERED);
  followRequestItems.mockReset().mockResolvedValue(ANSWERED);
  removeMediaRequest.mockReset().mockResolvedValue(null);
  stopRequestDownload.mockReset().mockResolvedValue(ANSWERED);
});

describe('TitlePage', () => {
  it('approves a title waiting on approval', async () => {
    const request = aMediaRequest({ approval: 'awaiting', state: 'awaitingApproval' });

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'toApprove', requestId: request.id, title: 'Dune' }),
    ];

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(approveMediaRequest).toHaveBeenCalledWith(request.id);
    });
    expect(screen.getByRole('button', { name: 'Decline…' })).toBeInTheDocument();
  });

  it('follows a title nobody asked for', async () => {
    catalogue.entries = [aCatalogueEntry({ key: 'film:27', catalogueId: '27' })];

    renderInAnAddress(<TitlePage titleKey="film:27" onBack={vi.fn()} />);

    await userEvent.setup().click(await screen.findByRole('button', { name: 'Follow' }));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({ kind: 'film', tmdbId: 27 });
    });
  });

  it('follows a season the request did not ask for, and stops following one it did', async () => {
    const request = aMediaRequest({
      kind: 'series',
      tmdbId: 42,
      seasons: [1],
      items: [
        aRequestItem({ id: 'a', season: 1, episode: 1, state: 'wanted' }),
        aRequestItem({ id: 'b', season: 1, episode: 2, state: 'wanted' }),
      ],
    });
    const user = userEvent.setup();

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({
        key: 'series:42',
        tab: 'shows',
        kind: 'series',
        catalogueId: '42',
        status: 'missing',
        requestId: request.id,
      }),
    ];

    renderInAnAddress(<TitlePage titleKey="series:42" onBack={vi.fn()} />);

    await user.click(await screen.findByRole('switch', { name: 'Follow Season 2' }));

    await waitFor(() => {
      expect(changeMediaRequest).toHaveBeenCalledWith(request.id, { seasons: [1, 2] });
    });

    await user.click(screen.getByRole('switch', { name: 'Follow Season 1' }));

    await waitFor(() => {
      expect(followRequestItems).toHaveBeenCalledWith(request.id, ['a', 'b'], false);
    });
  });

  it('stops getting new seasons of a show', async () => {
    const request = aMediaRequest({
      kind: 'series',
      tmdbId: 42,
      seasons: [1],
      followsNewSeasons: true,
      items: [aRequestItem({ id: 'a', season: 1, episode: 1, state: 'wanted' })],
    });

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({
        key: 'series:42',
        tab: 'shows',
        kind: 'series',
        catalogueId: '42',
        status: 'missing',
        requestId: request.id,
      }),
    ];

    renderInAnAddress(<TitlePage titleKey="series:42" onBack={vi.fn()} />);

    await userEvent
      .setup()
      .click(await screen.findByRole('switch', { name: 'Get new seasons as they come' }));

    await waitFor(() => {
      expect(changeMediaRequest).toHaveBeenCalledWith(request.id, { followsNewSeasons: false });
    });
  });

  it('stops a download, then lets a release be picked by hand', async () => {
    const request = aMediaRequest({
      items: [
        aRequestItem({ state: 'downloading', downloadId: 'd1', releaseTitle: 'Dune.2021.720p' }),
      ],
    });
    const user = userEvent.setup();

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'downloading', requestId: request.id }),
    ];

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Stop download…' }));
    await user.click(screen.getByRole('radio', { name: /Pick one myself/ }));
    await user.click(screen.getByRole('button', { name: 'Stop it' }));

    await waitFor(() => {
      expect(stopRequestDownload).toHaveBeenCalledWith(request.id, 'd1', {
        next: 'byHand',
        isDeletingFiles: true,
      });
    });
    expect(
      await screen.findByRole('dialog', { name: /Interactive search for Dune/ }),
    ).toBeInTheDocument();
  });

  it('offers an interactive search for a title an app fetches only when Valence controls the app', async () => {
    const request = aMediaRequest({ isHandedOff: true });

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'missing', requestId: request.id }),
    ];

    const { unmount } = renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: /Actions for/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Interactive search' })).not.toBeInTheDocument();

    unmount();
    admin.controlsConnectedApps = true;

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Interactive search' })).toBeInTheDocument();
  });

  it('shows what the app is downloading for a title it fetches, and stops it there', async () => {
    const request = aMediaRequest({
      isHandedOff: true,
      items: [aRequestItem({ id: '0b1d2c3e-4f56-4a78-9b01-23456789abcd', state: 'downloading' })],
    });
    const user = userEvent.setup();

    admin.controlsConnectedApps = true;
    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'downloading', requestId: request.id }),
    ];

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    expect(await screen.findByText('Dune.2021.1080p.BluRay')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stop download…' }));

    expect(
      await screen.findByText('Radarr deletes what it downloaded so far.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stop it' }));

    await waitFor(() => {
      expect(stopRequestDownload).toHaveBeenCalledWith(request.id, '5', {
        next: 'another',
        isDeletingFiles: true,
      });
    });
  });

  it('lays the menu’s actions along the row for wide screens', async () => {
    const request = aMediaRequest();
    const user = userEvent.setup();

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'library', requestId: request.id }),
    ];

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Remove…' }));

    expect(await screen.findByRole('dialog', { name: /Remove/ })).toBeInTheDocument();
  });

  it('removes a request, deleting its files where asked', async () => {
    const request = aMediaRequest();
    const user = userEvent.setup();

    requested.requests = [request];
    catalogue.entries = [
      aCatalogueEntry({ key: 'film:1', status: 'library', requestId: request.id }),
    ];

    renderInAnAddress(<TitlePage titleKey="film:1" onBack={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: /Actions for/ }));
    await user.click(await screen.findByRole('menuitem', { name: /Remove…/ }));

    const dialog = await screen.findByRole('dialog', { name: /Remove/ });

    await user.click(within(dialog).getByRole('checkbox', { name: /Delete the files/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(removeMediaRequest).toHaveBeenCalledWith(request.id, true, true);
    });
  });

  it('says so of a title no longer in the Catalogue, and goes back', async () => {
    const onBack = vi.fn();

    renderInAnAddress(<TitlePage titleKey="film:gone" onBack={onBack} />);

    await userEvent
      .setup()
      .click(await screen.findByRole('button', { name: 'Back to the Catalogue' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitlePage.displayName).toBe('TitlePage');
  });
});

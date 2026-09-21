import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ReleaseSearchPanel } from './ReleaseSearchPanel';
import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type * as Indexers from '@ValenceClient/requests/fetchIndexers';
import type * as Queue from '@ValenceClient/requests/fetchDownloadQueue';
import type * as Clients from '@ValenceClient/requests/fetchDownloadClients';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { Judgement, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import { aQualityProfile } from '@ValenceScreens/testing/aQualityProfile';

const searchReleases = vi.fn<typeof Indexers.searchReleases>();

const fetchRelease = vi.fn<typeof Indexers.fetchRelease>();
const downloadFile = vi.fn<(name: string, file: Blob) => void>();

vi.mock('@ValenceClient/requests/fetchIndexers', () => ({
  searchReleases: (...given: Parameters<typeof Indexers.searchReleases>) =>
    searchReleases(...given),
  fetchRelease: (...given: Parameters<typeof Indexers.fetchRelease>) => fetchRelease(...given),
  fetchIndexers: vi.fn(),
}));

const fetchDownloadClients = vi.fn<typeof Clients.fetchDownloadClients>();
const fetchProfiles = vi.fn<() => Promise<QualityProfile[]>>();

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({
  fetchProfiles: () => fetchProfiles(),
}));

const HD = aQualityProfile({
  id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
  resolutions: ['1080p'],
  sources: ['bluray'],
});

/**
 * A judgement of the release named.
 */
const aJudgement = (
  releaseId: string,
  score: number,
  rejections: string[],
  reasons: string[],
): Judgement => ({
  releaseId,
  parsed: {
    title: 'Dune Part Two',
    year: 2024,
    seasons: [],
    episodes: [],
    absoluteEpisodes: [],
    airDate: null,
    isCompleteSeries: false,
    resolution: null,
    source: null,
    codec: null,
    hdr: [],
    audio: [],
    audioChannels: null,
    musicQuality: null,
    edition: null,
    group: null,
    isProper: false,
    isRepack: false,
  },
  score,
  isRejected: rejections.length > 0,
  rejections,
  reasons,
});
const sendRelease = vi.fn<typeof Queue.sendRelease>();

vi.mock('@ValenceClient/requests/fetchDownloadClients', () => ({
  fetchDownloadClients: () => fetchDownloadClients(),
}));

vi.mock('@ValenceClient/requests/fetchDownloadQueue', () => ({
  sendRelease: (...given: Parameters<typeof Queue.sendRelease>) => sendRelease(...given),
}));

/**
 * A download client, with anything the test cares about changed.
 */
const aClient = (overrides: Partial<DownloadClient> = {}): DownloadClient => ({
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: '',
  hasPassword: false,
  hasApiKey: false,
  remotePath: '',
  localPath: '',
  categories: {
    movies: 'valence-films',
    shows: 'valence-series',
    music: 'valence-music',
    books: 'valence-books',
  },
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

vi.mock('@ValenceScreens/admin/downloadFile', () => ({
  downloadFile: (name: string, file: Blob) => {
    downloadFile(name, file);
  },
}));

const JACKETT = '0f8fad5b-d9cb-469f-a165-70867728950e';

/**
 * A release, with anything the test cares about changed.
 */
const aRelease = (title: string, overrides: Partial<Release> = {}): Release => ({
  id: title,
  title,
  indexerId: JACKETT,
  indexerName: 'Jackett',
  protocol: 'torrent',
  sizeBytes: 8_000_000_000,
  seeders: 40,
  leechers: 3,
  grabs: null,
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  categories: [2000],
  downloadUrl: 'http://jackett/dl/1',
  magnetUrl: 'magnet:?xt=urn:btih:abc',
  infoUrl: 'https://tracker.example/details/1',
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
  ...overrides,
});

const FOUND: ReleaseSearchOutcome = {
  releases: [
    aRelease('Dune.Part.Two.2024.720p', { seeders: 5 }),
    aRelease('Dune.Part.Two.2024.2160p'),
    aRelease('Dune.Part.Two.2024.NZB', {
      protocol: 'usenet',
      seeders: null,
      leechers: null,
      grabs: 3,
      sizeBytes: null,
      publishedAt: null,
      magnetUrl: null,
      infoUrl: null,
      indexerName: 'NZBgeek',
    }),
  ],
  indexers: [
    { indexerId: JACKETT, indexerName: 'Jackett', found: 2, tookMs: 1200, problem: null },
    {
      indexerId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      indexerName: 'Flaky',
      found: 0,
      tookMs: 30000,
      problem: 'The indexer did not answer within 30 seconds',
    },
  ],
  judgements: [],
  pickedId: null,
};

beforeEach(() => {
  searchReleases.mockReset().mockResolvedValue(FOUND);
  fetchRelease.mockReset().mockResolvedValue({
    value: { kind: 'file', file: new Blob(['d']), name: 'release.torrent' },
    refusal: null,
  });
  downloadFile.mockReset();
  fetchProfiles
    .mockReset()
    .mockResolvedValue([
      HD,
      { ...HD, id: '1b4e28ba-2fa1-11d2-883f-0016d3cca427', name: 'Lossless', kind: 'music' },
    ]);
  fetchDownloadClients
    .mockReset()
    .mockResolvedValue([
      aClient({ id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8', name: 'Off', isEnabled: false }),
      aClient(),
    ]);
  sendRelease.mockReset().mockResolvedValue({
    value: {
      id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
      clientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      clientName: 'qBittorrent',
      protocol: 'torrent',
      libraryKind: 'movies',
      title: 'Dune.Part.Two.2024.2160p',
      indexerName: 'Jackett',
      state: 'queued',
      problem: null,
      progress: 0,
      sizeBytes: 8_000_000_000,
      doneBytes: null,
      downloadBytesPerSecond: null,
      uploadBytesPerSecond: null,
      secondsLeft: null,
      seeds: null,
      peers: null,
      sentAt: '2026-09-19T00:00:00.000Z',
      finishedAt: null,
      filedInto: null,
      filingProblem: null,
    },
    refusal: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Searches for the words given.
 */
const searchFor = async (user: ReturnType<typeof userEvent.setup>, words: string) => {
  await user.type(screen.getByRole('searchbox', { name: /Search for/ }), words);
  await user.click(screen.getByRole('button', { name: 'Search' }));
};

describe('ReleaseSearchPanel', () => {
  it('says what it does before anything is searched for', () => {
    renderInAnAddress(<ReleaseSearchPanel />);

    expect(screen.getByText(/Search every enabled indexer at once/)).toBeInTheDocument();
    expect(searchReleases).not.toHaveBeenCalled();
  });

  it('searches every indexer, listing the most widely shared first', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune part two');

    await screen.findByText('Dune.Part.Two.2024.2160p');

    const rows = screen.getAllByRole('row').map((row) => row.textContent);

    expect(rows[1]).toContain('Dune.Part.Two.2024.2160p');
    expect(rows[1]).toContain('40 / 3');
    expect(rows[1]).toContain('3 days');
    expect(rows[1]).toContain('7.5 GB');
    expect(searchReleases).toHaveBeenCalledWith({ query: 'dune part two', mode: 'search' });
  });

  it('says what each indexer found, and why one found nothing', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText('Jackett: 2 in 1.2s')).toBeInTheDocument();
    expect(
      screen.getByText('Flaky: The indexer did not answer within 30 seconds'),
    ).toBeInTheDocument();
  });

  it('shows a usenet release by how often it was fetched', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText('3 grabs')).toBeInTheDocument();
  });

  it('searches for an episode of a series by season and number', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Series' }));
    await user.type(screen.getByRole('spinbutton', { name: /Season/ }), '2');
    await user.type(screen.getByRole('spinbutton', { name: /Episode/ }), '3');
    await searchFor(user, 'severance');

    await waitFor(() => {
      expect(searchReleases).toHaveBeenCalledWith({
        query: 'severance',
        mode: 'tv',
        season: 2,
        episode: 3,
      });
    });
  });

  it('leaves out a season nobody typed', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Series' }));
    await searchFor(user, 'severance');

    await waitFor(() => {
      expect(searchReleases).toHaveBeenCalledWith({ query: 'severance', mode: 'tv' });
    });
  });

  it('searches nothing for no words', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.type(screen.getByRole('searchbox', { name: /Search for/ }), '   {Enter}');

    expect(searchReleases).not.toHaveBeenCalled();
  });

  it('copies a release’s magnet link', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Copy the magnet link/ }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe('magnet:?xt=urn:btih:abc');
    });
    expect(await screen.findByText('The magnet link has been copied.')).toBeInTheDocument();
  });

  it('saves a release fetched through Valence', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Save the torrent/ }));

    expect(await screen.findByText('Saved Dune.Part.Two.2024.2160p.')).toBeInTheDocument();
    expect(fetchRelease).toHaveBeenCalledWith(JACKETT, 'http://jackett/dl/1');
    expect(downloadFile).toHaveBeenCalledWith('release.torrent', expect.any(Blob));
  });

  it('copies a release that turns out to be a magnet link', async () => {
    fetchRelease.mockResolvedValue({
      value: { kind: 'magnet', url: 'magnet:?xt=urn:btih:zzz' },
      refusal: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.NZB' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Save the NZB/ }));

    expect(
      await screen.findByText('That release is a magnet link, which has been copied.'),
    ).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe('magnet:?xt=urn:btih:zzz');
  });

  it('says why a release could not be saved', async () => {
    fetchRelease.mockResolvedValue({ value: null, refusal: { message: 'The site answered 410' } });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Save the torrent/ }));

    expect(await screen.findByText('The site answered 410')).toBeInTheDocument();

    fetchRelease.mockResolvedValue({ value: null, refusal: null });
    await user.click(screen.getByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }));
    await user.click(await screen.findByRole('menuitem', { name: /Save the torrent/ }));

    expect(await screen.findByText('The torrent could not be fetched.')).toBeInTheDocument();
  });

  it('sends a release to the first torrent client that is on', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Send to qBittorrent/ }));

    expect(
      await screen.findByText('Sent Dune.Part.Two.2024.2160p to qBittorrent.'),
    ).toBeInTheDocument();
    expect(sendRelease).toHaveBeenCalledWith({
      indexerId: JACKETT,
      url: 'http://jackett/dl/1',
      title: 'Dune.Part.Two.2024.2160p',
      protocol: 'torrent',
      libraryKind: 'movies',
      sizeBytes: 8_000_000_000,
      indexerName: 'Jackett',
      clientId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    });
  });

  it('asks what a release is for where neither the search nor its categories say', async () => {
    searchReleases.mockResolvedValue({
      releases: [aRelease('Mystery.Box', { categories: [8000] })],
      indexers: FOUND.indexers,
      judgements: [],
      pickedId: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'mystery');
    await user.click(await screen.findByRole('button', { name: 'Actions for Mystery.Box' }));

    expect(await screen.findByRole('menuitem', { name: /as a film/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /as a book/ })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitem', { name: /Send to qBittorrent as a series/ }));

    await waitFor(() => {
      expect(sendRelease).toHaveBeenCalledWith(expect.objectContaining({ libraryKind: 'shows' }));
    });
  });

  it('sends what was searched for as that kind', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Series' }));
    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Send to qBittorrent/ }));

    await waitFor(() => {
      expect(sendRelease).toHaveBeenCalledWith(expect.objectContaining({ libraryKind: 'shows' }));
    });
  });

  it('judges a search against a profile, in the order it would choose, marking the pick', async () => {
    searchReleases.mockResolvedValue({
      releases: [
        aRelease('Dune.Part.Two.2024.1080p.BluRay'),
        aRelease('Dune.Part.Two.2024.720p.WEB'),
        aRelease('Dune.Part.Two.2024.2160p'),
      ],
      indexers: FOUND.indexers,
      judgements: [
        aJudgement(
          'Dune.Part.Two.2024.1080p.BluRay',
          1100,
          [],
          ['1080p, the first choice', 'Blu-ray, the first choice'],
        ),
        aJudgement('Dune.Part.Two.2024.720p.WEB', 900, [], ['720p, the second choice']),
        aJudgement('Dune.Part.Two.2024.2160p', 0, ['2160p is not one this profile takes'], []),
      ],
      pickedId: 'Dune.Part.Two.2024.1080p.BluRay',
    });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Judge against' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'HD' }));
    await user.type(screen.getByRole('spinbutton', { name: /Running time/ }), '166');
    await searchFor(user, 'dune');

    await screen.findByText('Picked · 1100');

    const rows = screen.getAllByRole('row').map((row) => row.textContent);

    expect(rows[1]).toContain('Dune.Part.Two.2024.1080p.BluRay');
    expect(rows[1]).toContain('1080p, the first choice. Blu-ray, the first choice');
    expect(rows[2]).toContain('Scores 900');
    expect(rows[3]).toContain('Refused');
    expect(rows[3]).toContain('2160p is not one this profile takes');
    expect(searchReleases).toHaveBeenCalledWith({
      query: 'dune',
      mode: 'search',
      profileId: HD.id,
      runtimeMinutes: 166,
    });
  });

  it('asks no running time of a music profile, and leaves out an empty one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await user.click(screen.getByRole('button', { name: 'Judge against' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'HD' }));
    await searchFor(user, 'dune');

    await waitFor(() => {
      expect(searchReleases).toHaveBeenLastCalledWith({
        query: 'dune',
        mode: 'search',
        profileId: HD.id,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Judge against' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Lossless' }));

    expect(screen.queryByRole('spinbutton', { name: /Running time/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Judge against' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'No profile' }));

    expect(screen.getByRole('button', { name: 'Judge against' })).toHaveTextContent('No profile');
  });

  it('says why a release could not be sent', async () => {
    sendRelease.mockResolvedValueOnce({
      value: null,
      refusal: { message: 'qBittorrent could not be reached' },
    });
    sendRelease.mockResolvedValueOnce({ value: null, refusal: null });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    for (const said of [
      'qBittorrent could not be reached',
      'Dune.Part.Two.2024.2160p could not be sent.',
    ]) {
      await user.click(
        await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
      );
      await user.click(await screen.findByRole('menuitem', { name: /Send to qBittorrent/ }));

      expect(await screen.findByText(said)).toBeInTheDocument();
    }
  });

  it('offers no client for a release nothing switched on can take', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.NZB' }),
    );

    expect(
      await screen.findByRole('menuitem', { name: /Send to a usenet client/ }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('opens a release’s page somewhere else', async () => {
    const open = vi.fn();

    vi.stubGlobal('open', open);

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');
    await user.click(
      await screen.findByRole('button', { name: 'Actions for Dune.Part.Two.2024.2160p' }),
    );
    await user.click(await screen.findByRole('menuitem', { name: /Open its page/ }));

    expect(open).toHaveBeenCalledWith(
      'https://tracker.example/details/1',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('says so when no indexer is switched on', async () => {
    searchReleases.mockResolvedValue({
      releases: [],
      indexers: [],
      judgements: [],
      pickedId: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText(/No indexer is switched on/)).toBeInTheDocument();
  });

  it('says so when nothing was found', async () => {
    searchReleases.mockResolvedValue({
      releases: [],
      indexers: FOUND.indexers,
      judgements: [],
      pickedId: null,
    });

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByText(/Nothing was found/)).toBeInTheDocument();
  });

  it('says it could not search, and offers to try again', async () => {
    searchReleases.mockRejectedValue(new Error('offline'));

    const user = userEvent.setup();

    renderInAnAddress(<ReleaseSearchPanel />);

    await searchFor(user, 'dune');

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReleaseSearchPanel.displayName).toBe('ReleaseSearchPanel');
  });
});

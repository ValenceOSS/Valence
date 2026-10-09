import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OverviewPanel } from './OverviewPanel';
import { fetchResourceHistory } from '@ValenceClient/admin/fetchResourceHistory';
import type { ReactElement } from 'react';
import type { ActiveSession, AdminOverview, Job, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';
import type { ResourceSampleRecord } from '@ValenceContracts/schemas/ResourceSample';

vi.mock('@ValenceClient/admin/fetchResourceHistory', () => ({
  fetchResourceHistory: vi.fn(),
}));

const askedResourceHistory = vi.mocked(fetchResourceHistory);

beforeEach(() => {
  askedResourceHistory.mockReset();
  askedResourceHistory.mockResolvedValue([]);
});

/**
 * Renders under the query client the load range toggle needs, since choosing a range beyond the
 * last minute reads it through the cache.
 */
const renderPanel = (element: ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
    >
      {element}
    </QueryClientProvider>,
  );

const reason: Reason = {
  code: 'ClientSupportsSource',
  detail: sayVerbatim('Client declares support'),
};

const PLAN: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const overview = (overrides: Partial<AdminOverview> = {}): AdminOverview => ({
  users: [{ id: 'usr_1', name: 'Dan', email: 'dan@valence.local', role: 'admin', createdAt: '' }],
  settings: {
    hasCatalogueKey: true,
    hasAudioDbKey: false,
    hasOmdbKey: false,
    cookieSecure: true,
    hardwareAccel: '',
    previewQuality: 'high' as const,
    showsProfilesBeforeSignIn: false,
    fetchesCatalogueTrailers: false,
    fetchesMusicDetails: false,
    requestReleaseTypes: ['album'],
    certificationRegion: 'GB',
    keepsDownloadsForDays: 14,
    trustedOrigins: [],
  },
  transcoder: {
    isReachable: true,
    address: 'unix:/tmp/valence-transcoder.sock',
    ffmpegVersion: '7.1',
    ffmpegSupported: true,
    hardwareAccels: ['videotoolbox'],
    concurrentRenders: 0,
    toneMapping: 'unavailable' as const,
    hardwareToneMaps: [],
    chains: [],
  },
  library: { itemCount: 10, libraryCount: 1, bytes: 0 },
  artwork: null,
  bookPages: null,
  jobs: { stalled: [] },
  ...overrides,
});

const monitor = (jobs: Job[] = [], queued = 0): Monitor => ({
  resources: {
    atMs: 0,
    systemCpuPercent: 0,
    systemMemoryUsedBytes: 1,
    systemMemoryTotalBytes: 10,
    cpuCount: 8,
    serviceCpuPercent: 0,
    serviceMemoryBytes: 0,
    children: [],
    deploymentMemory: null,
    apiMemoryBytes: null,
    loadAverage: 0,
    disks: [],
    graphics: null,
    graphicsNotes: [],
    artefacts: null,
  },
  queue: { concurrency: 1, paused: false, queued, running: 0, jobs },
  sessions: 0,
  logs: [],
  cache: null,
});

const library = (overrides: Partial<Library> = {}): Library => ({
  id: 'lib_1',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 42,
  lastScannedAt: new Date().toISOString(),
  ...overrides,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
});

const job = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  kind: 'library.scan',
  subject: 'Films',
  state: 'running',
  queuedAtMs: 0,
  startedAtMs: 0,
  finishedAtMs: null,
  correlationId: null,
  stoppedBecause: null,
  failure: null,
  ...overrides,
});

const session = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  clientId: 'cli_1',
  accountId: 'acc_1',
  profileId: 'prf_1',
  profileName: 'Dan',
  isGuest: false,
  guestOf: null,
  fromServer: null,
  deviceLabel: 'Chrome on macOS',
  clientKind: 'browser' as const,
  connectedAt: 0,
  playback: null,
  listening: null,
  bookListening: null,
  reading: null,
  ...overrides,
});

const watching = (mode: 'direct' | 'transcode' = 'direct'): ActiveSession =>
  session({
    playback: {
      mediaId: 'med_1',
      mediaTitle: 'Arrival',
      seriesTitle: null,
      seasonNumber: null,
      episodeNumber: null,
      hasPoster: false,
      hasBackdrop: false,
      mode,
      plan: PLAN,
      reuse: null,
      isPlaying: true,
      pausedByAdmin: false,
      startedAt: 0,
      health: null,
    },
  });

const props = {
  overview: overview(),
  monitor: monitor(),
  libraries: [library()],
  sessions: [],
  readings: [],
  onOpenPanel: vi.fn(),
};

/**
 * The card a heading belongs to, so an assertion can be made against one region rather than the
 * whole dashboard — several cards say "Films".
 */
const card = (title: string): HTMLElement => {
  const region = screen.getByRole('heading', { name: title }).closest('section');

  if (!(region instanceof HTMLElement)) {
    throw new Error(`No card titled ${title}`);
  }

  return region;
};

describe('OverviewPanel', () => {
  it('shows every card even on a server with nothing wrong', () => {
    renderPanel(<OverviewPanel {...props} />);

    for (const title of ['Active now', 'Running now', 'Libraries', 'Server load', 'Recent jobs']) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  describe('watching now', () => {
    it('says when nobody is', () => {
      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByText('No one is watching, listening or reading.')).toBeInTheDocument();
    });

    it('names what is playing, and who is playing it', () => {
      renderPanel(<OverviewPanel {...props} sessions={[watching()]} />);

      const region = card('Active now');

      expect(within(region).getByText('Arrival')).toBeInTheDocument();
      expect(within(region).getByText(/Dan · Chrome on macOS/)).toBeInTheDocument();
    });

    it('says whether a stream is costing the box anything', () => {
      renderPanel(<OverviewPanel {...props} sessions={[watching('transcode')]} />);

      expect(within(card('Active now')).getByText('Transcode')).toBeInTheDocument();
    });

    it('counts somebody reading a book, and says they are reading', () => {
      renderPanel(
        <OverviewPanel
          {...props}
          sessions={[
            session({
              reading: {
                bookId: '00000000-0000-4000-8000-0000000000b1',
                title: 'Dune',
                authors: ['Frank Herbert'],
                hasCover: false,
                fraction: 0.5,
                pageNumber: null,
                reportedAtMs: 1,
              },
            }),
          ]}
        />,
      );

      const region = card('Active now');

      expect(within(region).getByText('Dune')).toBeInTheDocument();
      expect(within(region).getByText('Reading')).toBeInTheDocument();
    });

    it('ignores a session with the app open but nothing playing', () => {
      renderPanel(<OverviewPanel {...props} sessions={[session()]} />);

      expect(screen.getByText('No one is watching, listening or reading.')).toBeInTheDocument();
    });
  });

  describe('running now', () => {
    it('says when nothing is', () => {
      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByText('Nothing is running.')).toBeInTheDocument();
    });

    it('mentions a queue that has not started yet', () => {
      renderPanel(<OverviewPanel {...props} monitor={monitor([], 3)} />);

      expect(screen.getByText(/Nothing running,/)).toHaveTextContent('Nothing running, 3 waiting.');
    });

    it('names what is running', () => {
      renderPanel(<OverviewPanel {...props} monitor={monitor([job()])} />);

      const region = card('Running now');

      expect(within(region).getByText('Films')).toBeInTheDocument();
      expect(within(region).getByText('library.scan')).toBeInTheDocument();
    });

    it('leaves finished work to the jobs panel', () => {
      renderPanel(<OverviewPanel {...props} monitor={monitor([job({ state: 'finished' })])} />);

      expect(screen.getByText('Nothing is running.')).toBeInTheDocument();
    });
  });

  describe('libraries', () => {
    it('counts what is in each one and when it was last read', () => {
      renderPanel(<OverviewPanel {...props} />);

      const region = card('Libraries');

      expect(within(region).getByText(/items$/)).toHaveTextContent('42 items');
      expect(within(region).getByText(/Scanned just now/)).toBeInTheDocument();
    });

    it('says when one has never been scanned', () => {
      renderPanel(<OverviewPanel {...props} libraries={[library({ lastScannedAt: null })]} />);

      expect(within(card('Libraries')).getByText(/Scanned never/)).toBeInTheDocument();
    });

    it('says when there are none', () => {
      renderPanel(<OverviewPanel {...props} libraries={[]} />);

      expect(screen.getByText('No libraries yet.')).toBeInTheDocument();
    });
  });

  it('reaches every panel it points at', async () => {
    const onOpenPanel = vi.fn<(panel: string) => void>();
    const user = userEvent.setup();
    renderPanel(<OverviewPanel {...props} onOpenPanel={onOpenPanel} />);

    await user.click(screen.getByRole('button', { name: /All sessions/ }));
    await user.click(screen.getByRole('button', { name: /All jobs/ }));
    await user.click(screen.getByRole('button', { name: /Manage/ }));

    expect(onOpenPanel.mock.calls.map(([panel]) => panel)).toEqual([
      'activity',
      'jobs',
      'libraries',
    ]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(OverviewPanel.displayName).toBe('OverviewPanel');
  });

  describe('load range', () => {
    const RANGE_MENU = 'Load time range';

    const sample = (overrides: Partial<ResourceSampleRecord> = {}): ResourceSampleRecord => ({
      id: 'sample-1',
      atMs: Date.now(),
      systemCpuPercent: 50,
      loadAverage: 1.2,
      systemMemoryUsedBytes: 1,
      systemMemoryTotalBytes: 10,
      cpuCount: 8,
      ...overrides,
    });

    it('shows the last seven days by default', async () => {
      askedResourceHistory.mockResolvedValue([]);

      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByRole('button', { name: RANGE_MENU })).toHaveTextContent('Last 7 days');

      await waitFor(() => {
        expect(askedResourceHistory).toHaveBeenCalledWith('7d');
      });
    });

    it('feeds the last minute from the live buffer rather than a fetch', async () => {
      const actor = userEvent.setup();

      askedResourceHistory.mockResolvedValue([]);
      renderPanel(<OverviewPanel {...props} readings={[sample({ systemCpuPercent: 10 })]} />);
      await waitFor(() => {
        expect(askedResourceHistory).toHaveBeenCalledTimes(1);
      });

      await actor.click(screen.getByRole('button', { name: RANGE_MENU }));
      await actor.click(await screen.findByRole('menuitemradio', { name: 'Last minute' }));

      expect(askedResourceHistory).toHaveBeenCalledTimes(1);
    });

    it('reads a persisted range once it is chosen, and charts it', async () => {
      const actor = userEvent.setup();

      askedResourceHistory.mockResolvedValue([
        sample({ systemCpuPercent: 20 }),
        sample({ systemCpuPercent: 80 }),
      ]);

      renderPanel(<OverviewPanel {...props} />);

      await actor.click(screen.getByRole('button', { name: RANGE_MENU }));
      await actor.click(await screen.findByRole('menuitemradio', { name: 'Last 24 hours' }));

      expect((await screen.findByText('Peak')).nextElementSibling).toHaveTextContent('80%');
      expect(askedResourceHistory).toHaveBeenCalledWith('24h');
    });

    it('says nothing has been measured yet rather than drawing an empty chart oddly', async () => {
      askedResourceHistory.mockResolvedValue([]);

      renderPanel(<OverviewPanel {...props} />);

      expect(await screen.findByText('Nothing measured yet.')).toBeInTheDocument();
    });
  });
});

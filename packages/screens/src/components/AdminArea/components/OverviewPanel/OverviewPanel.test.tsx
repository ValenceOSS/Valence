import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OverviewPanel } from './OverviewPanel';
import { measureStorage } from '@ValenceClient/admin/fetchAdmin';
import { fetchResourceHistory } from '@ValenceClient/admin/fetchResourceHistory';
import type { ReactElement } from 'react';
import type * as FetchAdmin from '@ValenceClient/admin/fetchAdmin';
import type { ActiveSession, AdminOverview, Job, Monitor } from '@ValenceClient/admin/fetchAdmin';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';
import type { ResourceSampleRecord } from '@ValenceContracts/schemas/ResourceSample';

vi.mock('@ValenceClient/admin/fetchAdmin', async (importOriginal) => ({
  ...(await importOriginal<typeof FetchAdmin>()),
  measureStorage: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchResourceHistory', () => ({
  fetchResourceHistory: vi.fn(),
}));

const measured = vi.mocked(measureStorage);
const askedResourceHistory = vi.mocked(fetchResourceHistory);

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

const reason: Reason = { code: 'ClientSupportsSource', detail: 'Client declares support' };

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
    cookieSecure: true,
    hardwareAccel: '',
    previewQuality: 'high' as const,
    showsProfilesBeforeSignIn: false,
    fetchesCatalogueTrailers: false,
    certificationRegion: 'GB',
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
    artefacts: null,
  },
  queue: { concurrency: 1, queued, running: 0, jobs },
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
  failure: null,
  ...overrides,
});

const session = (overrides: Partial<ActiveSession> = {}): ActiveSession => ({
  clientId: 'cli_1',
  profileId: 'prf_1',
  profileName: 'Dan',
  deviceLabel: 'Chrome on macOS',
  connectedAt: 0,
  playback: null,
  ...overrides,
});

const watching = (mode: 'direct' | 'transcode' = 'direct'): ActiveSession =>
  session({
    playback: {
      mediaId: 'med_1',
      mediaTitle: 'Arrival',
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
  history: [],
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

    for (const title of [
      'Watching now',
      'Running now',
      'Libraries',
      'Server load',
      'Recent jobs',
    ]) {
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    }
  });

  describe('watching now', () => {
    it('says when nobody is', () => {
      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByText('Nobody is watching anything.')).toBeInTheDocument();
    });

    it('names what is playing, and who is playing it', () => {
      renderPanel(<OverviewPanel {...props} sessions={[watching()]} />);

      const region = card('Watching now');

      expect(within(region).getByText('Arrival')).toBeInTheDocument();
      expect(within(region).getByText(/Dan · Chrome on macOS/)).toBeInTheDocument();
    });

    it('says whether a stream is costing the box anything', () => {
      renderPanel(<OverviewPanel {...props} sessions={[watching('transcode')]} />);

      expect(within(card('Watching now')).getByText('Transcode')).toBeInTheDocument();
    });

    it('ignores a session with the app open but nothing playing', () => {
      renderPanel(<OverviewPanel {...props} sessions={[session()]} />);

      expect(screen.getByText('Nobody is watching anything.')).toBeInTheDocument();
    });
  });

  describe('running now', () => {
    it('says when nothing is', () => {
      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByText('Nothing is running.')).toBeInTheDocument();
    });

    it('mentions a queue that has not started yet', () => {
      renderPanel(<OverviewPanel {...props} monitor={monitor([], 3)} />);

      expect(screen.getByText('Nothing running, 3 waiting.')).toBeInTheDocument();
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

      expect(within(region).getByText('42 items')).toBeInTheDocument();
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

  describe('counting the storage again', () => {
    const counted = {
      cache: {
        previews: { count: 1, bytes: 5 * 1024 ** 2 },
        trickplay: { count: 1, bytes: 1024 },
        sessions: { count: 0, bytes: 0 },
        atMs: Date.now(),
      },
      artwork: { count: 2, bytes: 2048, atMs: Date.now() },
      bookPages: null,
      libraryBytes: 3 * 1024 ** 4,
    };

    it('offers a way to ask for the figures again', () => {
      renderPanel(<OverviewPanel {...props} />);

      expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
    });

    it('shows what the count found, rather than what the timer last saw', async () => {
      measured.mockResolvedValue(counted);

      const actor = userEvent.setup();

      renderPanel(<OverviewPanel {...props} />);
      await actor.click(screen.getByRole('button', { name: /Refresh/ }));

      await waitFor(() => {
        expect(screen.getByText('5.0 MB')).toBeInTheDocument();
      });
    });

    it('leaves the figures alone when the count could not be made', async () => {
      measured.mockResolvedValue(null);

      const actor = userEvent.setup();

      renderPanel(<OverviewPanel {...props} />);
      await actor.click(screen.getByRole('button', { name: /Refresh/ }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/ })).toBeEnabled();
      });

      expect(screen.getAllByText('Still counting').length).toBeGreaterThan(0);
    });
  });

  describe('load range', () => {
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

    it('shows the last minute by default, fed by the live buffer rather than a fetch', () => {
      renderPanel(<OverviewPanel {...props} history={[10, 20, 30]} />);

      expect(screen.getByRole('button', { name: 'Last minute' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(askedResourceHistory).not.toHaveBeenCalled();
    });

    it('reads a persisted range once it is chosen, and charts it', async () => {
      const actor = userEvent.setup();

      askedResourceHistory.mockResolvedValue([
        sample({ systemCpuPercent: 20 }),
        sample({ systemCpuPercent: 80 }),
      ]);

      renderPanel(<OverviewPanel {...props} />);

      await actor.click(screen.getByRole('button', { name: '24h' }));

      expect(await screen.findByText(/Peak 80%/)).toBeInTheDocument();
      expect(askedResourceHistory).toHaveBeenCalledWith('24h');
    });

    it('says nothing has been measured yet rather than drawing an empty chart oddly', async () => {
      const actor = userEvent.setup();

      askedResourceHistory.mockResolvedValue([]);

      renderPanel(<OverviewPanel {...props} />);

      await actor.click(screen.getByRole('button', { name: '7d' }));

      expect(await screen.findByText('Nothing measured yet.')).toBeInTheDocument();
    });
  });
});

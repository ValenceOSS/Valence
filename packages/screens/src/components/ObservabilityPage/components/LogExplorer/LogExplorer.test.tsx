import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchLogFacets } from '@ValenceClient/admin/fetchLogFacets';
import { fetchLogHistogram } from '@ValenceClient/admin/fetchLogHistogram';
import { fetchLogs } from '@ValenceClient/admin/fetchLogs';
import { ObservabilitySearchHost } from '@ValenceScreens/testing/ObservabilitySearchHost';
import { LogExplorer } from './LogExplorer';
import type { ReactElement } from 'react';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { ObservabilitySearch } from '@ValenceClient/admin/ObservabilitySearchSchema';
import type { LogRecord } from '@ValenceContracts/schemas/Log';
import type { LogExplorerProps } from './LogExplorer.types';

vi.mock('@ValenceClient/admin/fetchLogs', () => ({ fetchLogs: vi.fn(), watchLogs: vi.fn() }));
vi.mock('@ValenceClient/admin/fetchLogHistogram', () => ({ fetchLogHistogram: vi.fn() }));
vi.mock('@ValenceClient/admin/fetchLogFacets', () => ({ fetchLogFacets: vi.fn() }));

const askedLogs = vi.mocked(fetchLogs);
const askedHistogram = vi.mocked(fetchLogHistogram);
const askedFacets = vi.mocked(fetchLogFacets);

const DEFINITIONS: JobDefinition[] = [
  {
    kind: 'library.scan',
    label: 'Scan for changes',
    description: 'Looks for new files.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
  },
];

const record = (id: string, over: Partial<LogRecord> = {}): LogRecord => ({
  id,
  atMs: new Date(2026, 8, 21, 14, 3, 9).getTime(),
  level: 'error',
  source: 'scanner',
  message: `Could not read file ${id}`,
  detail: null,
  count: 1,
  context: {
    jobId: 'job-1',
    jobKind: 'library.scan',
    libraryId: null,
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
  ...over,
});

const HISTOGRAM = {
  fromMs: 0,
  untilMs: 3000,
  bucketMs: 1000,
  buckets: [
    { atMs: 0, debug: 0, info: 10, warn: 0, error: 2 },
    { atMs: 1000, debug: 0, info: 5, warn: 3, error: 0 },
    { atMs: 2000, debug: 1, info: 0, warn: 0, error: 4 },
  ],
};

const FACETS = {
  sources: [
    { value: 'scanner', events: 30 },
    { value: 'jobs', events: 10 },
  ],
  jobKinds: [{ value: 'library.scan', events: 25 }],
};

const draw = (
  over: Partial<Omit<LogExplorerProps, 'search' | 'onSearchChange'>> = {},
  initial: ObservabilitySearch = {},
): ReactElement => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })}
  >
    <ObservabilitySearchHost initial={initial}>
      {(search, update) => (
        <LogExplorer
          definitions={DEFINITIONS}
          search={search}
          onSearchChange={update}
          onTraceJob={vi.fn()}
          copy={() => Promise.resolve()}
          download={vi.fn()}
          {...over}
        />
      )}
    </ObservabilitySearchHost>
  </QueryClientProvider>
);

const lastLogQuery = () => askedLogs.mock.calls.at(-1)?.[0];

beforeEach(() => {
  askedLogs.mockResolvedValue({ records: [record('a'), record('b', { level: 'warn' })], total: 2 });
  askedHistogram.mockResolvedValue(HISTOGRAM);
  askedFacets.mockResolvedValue(FACETS);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('LogExplorer', () => {
  it('lists the lines of the last day, newest first, every level', async () => {
    render(draw());

    expect(await screen.findByText('Could not read file a')).toBeInTheDocument();
    expect(screen.getByText('Could not read file b')).toBeInTheDocument();
    expect(lastLogQuery()).toMatchObject({
      levels: ['debug', 'info', 'warn', 'error'],
      sort: 'newest',
      limit: 200,
      jobId: null,
    });
    expect(lastLogQuery()?.sinceMs).toBeGreaterThan(Date.now() - 86_500_000);
  });

  it('says how many events there were, and how many at each level', async () => {
    render(draw());

    const levels = await screen.findByRole('list', { name: 'Levels' });

    expect(levels.previousElementSibling).toHaveTextContent('25 events');
    expect(within(levels).getByRole('button', { name: /Errors/ })).toHaveTextContent('6');
    expect(within(levels).getByRole('button', { name: /Warnings/ })).toHaveTextContent('3');
    expect(within(levels).getByRole('button', { name: /Info/ })).toHaveTextContent('15');
  });

  it('narrows to the levels switched on, and asks the graph about every level', async () => {
    render(draw());
    await userEvent.click(await screen.findByRole('button', { name: /Debug/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.levels).toStrictEqual(['info', 'warn', 'error']);
    });
    expect(askedHistogram.mock.calls.at(-1)?.[0]).toMatchObject({
      levels: ['debug', 'info', 'warn', 'error'],
    });
    expect(askedFacets.mock.calls.at(-1)?.[0]).toMatchObject({ levels: ['info', 'warn', 'error'] });
  });

  it('switches a level back on', async () => {
    render(draw());
    await userEvent.click(await screen.findByRole('button', { name: /Debug/ }));
    await userEvent.click(await screen.findByRole('button', { name: /Debug/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.levels).toStrictEqual(['debug', 'info', 'warn', 'error']);
    });
  });

  it('says how many lines are shown of how many there are', async () => {
    askedLogs.mockResolvedValue({ records: [record('a')], total: 1204 });

    render(draw());

    await waitFor(() => {
      expect(screen.getByText(/^Showing/)).toHaveTextContent('Showing 1 of 1,204');
    });
  });

  describe('scrolling', () => {
    const watchers: { call: (seen: { isIntersecting: boolean }[]) => void }[] = [];

    beforeEach(() => {
      watchers.length = 0;

      class Watcher {
        constructor(call: (seen: { isIntersecting: boolean }[]) => void) {
          watchers.push({ call });
        }

        observe = vi.fn();
        disconnect = vi.fn();
      }

      vi.stubGlobal('IntersectionObserver', Watcher);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('reads the next page when the end of the list scrolls into view', async () => {
      askedLogs.mockResolvedValue({ records: [record('a')], total: 900 });

      render(draw());
      await screen.findByText('Could not read file a');
      await waitFor(() => {
        expect(watchers.length).toBeGreaterThan(0);
      });

      await act(async () => {
        watchers.at(-1)?.call([{ isIntersecting: true }]);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(askedLogs.mock.calls.at(-1)?.[0]).toMatchObject({ offset: 1 });
      });
    });

    it('does not read on while the end is out of view', async () => {
      askedLogs.mockResolvedValue({ records: [record('a')], total: 900 });

      render(draw());
      await screen.findByText('Could not read file a');
      await waitFor(() => {
        expect(watchers.length).toBeGreaterThan(0);
      });

      await act(async () => {
        watchers.at(-1)?.call([{ isIntersecting: false }]);
        await Promise.resolve();
      });

      expect(askedLogs).toHaveBeenCalledTimes(1);
    });

    it('lists the lines in a box of their own that scrolls, level with the columns beside it', async () => {
      render(draw());

      const list = await screen.findByRole('list', { name: 'Log lines' });

      expect(list.parentElement).toHaveClass('overflow-y-auto', 'max-h-[70svh]', 'lg:absolute');
    });

    it('says when everything has been read', async () => {
      render(draw());

      expect(await screen.findByText('That is everything.')).toBeInTheDocument();
    });
  });

  it('offers a button to read more where the browser cannot watch the end of the list', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    askedLogs.mockResolvedValue({ records: [record('a')], total: 900 });

    render(draw());
    await userEvent.click(await screen.findByRole('button', { name: 'Show more' }));

    await waitFor(() => {
      expect(askedLogs.mock.calls.at(-1)?.[0]).toMatchObject({ offset: 1 });
    });

    vi.unstubAllGlobals();
  });

  it('says so where nothing matches, and suggests what to do', async () => {
    askedLogs.mockResolvedValue({ records: [], total: 0 });

    render(draw());

    expect(await screen.findByText('No log lines match this')).toBeInTheDocument();
  });

  it('opens a line in place to show its detail', async () => {
    askedLogs.mockResolvedValue({
      records: [record('a', { detail: 'at readFile()' })],
      total: 1,
    });

    render(draw());
    await userEvent.click(await screen.findByRole('button', { name: /Could not read file a/ }));

    expect(screen.getByText('at readFile()')).toBeInTheDocument();
  });

  it('turns a finished field typed into the search into a filter chip', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the log' }), 'job:abc123 ');

    await waitFor(() => {
      expect(lastLogQuery()).toMatchObject({ jobId: 'abc123', search: '' });
    });
    expect(await screen.findByText(/abc123/)).toBeInTheDocument();
  });

  it('searches for words that are not fields', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the log' }), 'unreadable');

    await waitFor(() => {
      expect(lastLogQuery()).toMatchObject({ search: 'unreadable' });
    });
  });

  it('narrows to a source when its row in the top sources is pressed', async () => {
    render(draw());

    await userEvent.click(await screen.findByRole('button', { name: /^jobs\s*10/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.sources).toStrictEqual(['jobs']);
    });
    expect(askedHistogram.mock.calls.at(-1)?.[0]).toMatchObject({ sources: ['jobs'] });
    expect(askedFacets.mock.calls.at(-1)?.[0]).toMatchObject({ sources: ['jobs'] });
  });

  it('names a kind of job in words in the top jobs, and narrows to it when pressed', async () => {
    render(draw());

    await userEvent.click(await screen.findByRole('button', { name: /Scan for changes/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.jobKinds).toStrictEqual(['library.scan']);
    });
  });

  it('narrows to what a line says it belongs to, from its menu', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getAllByRole('button', { name: 'Actions for this line' })[0]!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Only scanner' }));

    await waitFor(() => {
      expect(lastLogQuery()?.sources).toStrictEqual(['scanner']);
    });
  });

  it('follows a line to its job’s trace', async () => {
    const onTraceJob = vi.fn();

    render(draw({ onTraceJob }));
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getAllByRole('button', { name: 'Actions for this line' })[0]!);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Trace this job' }));

    expect(onTraceJob).toHaveBeenCalledWith('job-1');
  });

  it('changes the time range', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getByRole('button', { name: 'Time range' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Last 7 days' }));

    await waitFor(() => {
      expect(lastLogQuery()?.sinceMs).toBeLessThan(Date.now() - 6.9 * 86_400_000);
    });
  });

  it('reads everything kept where the range has no start', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getByRole('button', { name: 'Time range' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Everything kept' }));

    await waitFor(() => {
      expect(lastLogQuery()?.sinceMs).toBeNull();
    });
  });

  it('changes the order', async () => {
    render(draw());
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getByRole('button', { name: 'Order' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Oldest first/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.sort).toBe('oldest');
    });
  });

  it('zooms into the stretch dragged across on the graph, and can put it back', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 90,
      bottom: 40,
      width: 90,
      height: 40,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    render(draw());
    await screen.findByText('Could not read file a');

    const chart = screen.getByRole('img', {
      name: 'How many events the log holds at each level over time',
    });

    fireEvent.pointerDown(chart, { clientX: 40 });
    fireEvent.pointerUp(chart, { clientX: 80 });

    await waitFor(() => {
      expect(lastLogQuery()).toMatchObject({ sinceMs: 1000, untilMs: 3000 });
    });

    await userEvent.click(await screen.findByRole('button', { name: /^Zoomed to/ }));

    await waitFor(() => {
      expect(lastLogQuery()?.untilMs).toBeNull();
    });
  });

  it('starts reading again every few seconds once live, and stops when it is turned off', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(draw());
    await screen.findByText('Could not read file a');

    const live = screen.getByRole('button', { name: 'Live' });

    await userEvent.click(live);

    expect(live).toHaveAttribute('aria-pressed', 'true');

    const before = askedLogs.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3500);
    });

    await waitFor(() => {
      expect(askedLogs.mock.calls.length).toBeGreaterThan(before);
    });

    await userEvent.click(live);

    const after = askedLogs.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(7000);
    });

    expect(askedLogs.mock.calls.length).toBe(after);

    vi.useRealTimers();
  });

  it('opens on the log of one job where the address says so', async () => {
    render(draw({}, { q: 'job:job-9', range: 'all' }));

    await waitFor(() => {
      expect(lastLogQuery()).toMatchObject({ jobId: 'job-9', sinceMs: null });
    });
  });

  it('writes what it is narrowed to into the address', async () => {
    const onChange = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ObservabilitySearchHost onChange={onChange}>
          {(search, update) => (
            <LogExplorer
              definitions={DEFINITIONS}
              search={search}
              onSearchChange={update}
              onTraceJob={vi.fn()}
            />
          )}
        </ObservabilitySearchHost>
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole('button', { name: /^jobs\s*10/ }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ q: 'source:jobs' }));
  });

  it('is narrowed by what the address says, and writes the words typed after a moment', async () => {
    const onChange = vi.fn();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <ObservabilitySearchHost initial={{ q: 'level:error unreadable' }} onChange={onChange}>
          {(search, update) => (
            <LogExplorer
              definitions={DEFINITIONS}
              search={search}
              onSearchChange={update}
              onTraceJob={vi.fn()}
            />
          )}
        </ObservabilitySearchHost>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('searchbox', { name: 'Search the log' })).toHaveValue(
      'unreadable',
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search the log' }), ' file');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'level:error unreadable file' }),
      );
    });
  });

  it('copies and downloads the lines shown, and only where there are some', async () => {
    const copy = vi.fn(() => Promise.resolve());
    const download = vi.fn();

    render(draw({ copy, download }));
    await screen.findByText('Could not read file a');
    await userEvent.click(screen.getByRole('button', { name: 'More about these lines' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy these lines' }));

    expect(copy).toHaveBeenCalledWith(expect.stringContaining('Could not read file a'));

    await userEvent.click(screen.getByRole('button', { name: 'More about these lines' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Download these lines' }));

    expect(download).toHaveBeenCalledWith(
      expect.stringMatching(/^valence-log-\d{4}-\d\d-\d\d\.txt$/),
      expect.stringContaining('Could not read file b'),
    );
  });

  it('draws no cards, being laid flat on the page', async () => {
    const { container } = render(draw());

    await screen.findByText('Could not read file a');

    expect(container.querySelector('.valence-card-shell, .valence-card-face')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LogExplorer.displayName).toBe('LogExplorer');
  });
});

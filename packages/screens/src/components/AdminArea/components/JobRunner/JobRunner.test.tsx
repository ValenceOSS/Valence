import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobRunner } from './JobRunner';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { ScanEntry } from '@ValenceScreens/components/AdminArea/scanCoordinator';

const DEFINITIONS: JobDefinition[] = [
  {
    kind: 'library.scan',
    label: sayVerbatim('Scan for changes'),
    description: sayVerbatim('Finds new, changed and removed files.'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    group: 'library',
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: 'library.regeneratePreviews',
    label: sayVerbatim('Generate missing previews'),
    description: sayVerbatim('Renders preview clips for items that have none.'),
    needsLibrary: true,
    destructive: false,
    takesParts: false,
    group: 'library',
    runsByHand: true,
    schedulable: true,
  },
  {
    kind: 'library.reset',
    label: sayVerbatim('Reset and rebuild'),
    description: sayVerbatim('Deletes everything in every library, then scans it from nothing.'),
    needsLibrary: true,
    destructive: true,
    takesParts: false,
    group: 'reset',
    runsByHand: true,
    schedulable: false,
  },
];

const MOVIES: Library = {
  id: 'lib-movies',
  name: 'Movies',
  kind: 'movies',
  path: '/media/movies',
  itemCount: 10,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
};

/**
 * Presses one of a job's buttons by what it is called.
 */
const press = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(await screen.findByRole('button', { name }));
};

describe('JobRunner', () => {
  it('lists every job an admin can start', () => {
    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getByText('Scan for changes')).toBeInTheDocument();
    expect(
      screen.getByText('Deletes everything in every library, then scans it from nothing.'),
    ).toBeInTheDocument();
  });

  it('asks which libraries a library job runs on before starting it', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Scan for changes');

    expect(onRun).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Run on every library' }));

    expect(onRun).toHaveBeenCalledWith('library.scan', ['lib-movies']);
  });

  it('runs a library job on only the libraries left ticked', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    const shows: Library = { ...MOVIES, id: 'lib-shows', name: 'Shows', kind: 'shows' };

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES, shows]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Scan for changes');
    await user.click(screen.getByRole('checkbox', { name: /Movies/ }));
    await user.click(screen.getByRole('button', { name: 'Run on 1 library' }));

    expect(onRun).toHaveBeenCalledWith('library.scan', ['lib-shows']);
  });

  it('asks which parts to clear for the job that clears them, and has no schedule for it', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={[
          {
            kind: 'library.clearParts',
            label: sayVerbatim('Clear and refresh'),
            description: sayVerbatim('Erases the chosen parts of a library.'),
            needsLibrary: true,
            destructive: true,
            takesParts: true,
            group: 'reset',
            runsByHand: true,
            schedulable: false,
          },
        ]}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Edit the schedule for Clear and refresh' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Manual only')).toBeInTheDocument();

    await press(user, 'Run Clear and refresh');
    await user.click(screen.getByRole('checkbox', { name: /^Cast/ }));
    await user.click(screen.getByRole('button', { name: 'Clear 1 part' }));

    expect(onRun).toHaveBeenCalledWith('library.clearParts', ['lib-movies'], ['cast']);
  });

  it('asks before running a destructive server-wide job', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={[
          {
            kind: 'history.prune',
            label: sayVerbatim('Prune old watch history'),
            description: sayVerbatim('Deletes watch history older than a year.'),
            needsLibrary: false,
            destructive: true,
            takesParts: false,
            group: 'housekeeping',
            runsByHand: true,
            schedulable: true,
          },
        ]}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Prune old watch history');

    expect(onRun).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Prune old watch history' }));

    expect(onRun).toHaveBeenCalledWith('history.prune');
  });

  it('opens a job’s schedule from its schedule button', async () => {
    const onOpenSchedule = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={onOpenSchedule}
      />,
    );

    await press(user, 'Edit the schedule for Scan for changes');

    expect(onOpenSchedule).toHaveBeenCalledWith('library.scan');
  });

  it('asks before running a destructive job, rather than running it immediately', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Reset and rebuild');

    expect(onRun).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Reset and rebuild?' })).toBeInTheDocument();
  });

  it('runs a destructive job once confirmed', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Reset and rebuild');
    await user.click(screen.getByRole('button', { name: 'Reset and rebuild on every library' }));

    expect(onRun).toHaveBeenCalledWith('library.reset', ['lib-movies']);
  });

  it('leaves a destructive job untouched when the confirmation is cancelled', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Reset and rebuild');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRun).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Reset and rebuild?' })).not.toBeInTheDocument();
  });

  it('says a job is running rather than offering to start it again', () => {
    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.scan',
          phase: 'probing',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Stop Scan for changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Run Scan for changes' })).not.toBeInTheDocument();
  });

  it('says running once for a job spread across several libraries, not once each', () => {
    const shows = { ...MOVIES, id: 'lib-shows', name: 'Shows' };
    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.scan',
          phase: 'previews',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
      [
        'lib-shows',
        {
          libraryId: 'lib-shows',
          kind: 'library.scan',
          phase: 'previews',
          processed: 2,
          total: 6,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES, shows]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Stop Scan for changes' })).toHaveLength(1);
  });

  it('offers to stop a job that is running, and says which kind to stop', async () => {
    const user = userEvent.setup();
    const onStop = vi.fn<(kind: string) => void>();

    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.scan',
          phase: 'probing',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={onStop}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Stop Scan for changes');

    expect(onStop).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Stop job' }));

    expect(onStop).toHaveBeenCalledWith('library.scan');
  });

  it('leaves a running job alone when stopping it is cancelled', async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={
          new Map<string, ScanEntry>([
            [
              'lib-movies',
              {
                libraryId: 'lib-movies',
                kind: 'library.scan',
                phase: 'probing',
                processed: 1,
                total: 4,
                item: null,
                jobId: 'job-1',
                isStopping: false,
              },
            ],
          ])
        }
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={onStop}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Stop Scan for changes');
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(onStop).not.toHaveBeenCalled();
  });

  it('paints the answer to choosing libraries for a destructive job red', async () => {
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Reset and rebuild');

    expect(screen.getByRole('button', { name: 'Reset and rebuild on every library' })).toHaveClass(
      'bg-danger',
    );
  });

  it('does not offer to stop a job that is not running', async () => {
    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: 'Run Scan for changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop Scan for changes' })).not.toBeInTheDocument();
  });

  it('refuses to start another job while one is going', async () => {
    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.scan',
          phase: 'probing',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(
      await screen.findByRole('button', { name: 'Run Generate missing previews' }),
    ).toBeDisabled();
  });

  it('still runs a server-wide job while a library is busy, which is when it is wanted most', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'server.checkTranscoder',
        label: sayVerbatim('Check the transcoder'),
        description: sayVerbatim('Asks the transcoder whether it is still answering.'),
        needsLibrary: false,
        destructive: false,
        takesParts: false,
        group: 'health',
        runsByHand: true,
        schedulable: true,
      },
    ];

    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.scan',
          phase: 'probing',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await press(user, 'Run Check the transcoder');

    expect(onRun).toHaveBeenCalledWith('server.checkTranscoder');
  });

  it('puts each job under the heading of its group', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'catalogue.rematch',
        label: sayVerbatim('Re-match against the catalogue'),
        description: sayVerbatim('Retries metadata matching for every item on the server.'),
        needsLibrary: false,
        destructive: false,
        takesParts: false,
        group: 'health',
        runsByHand: true,
        schedulable: true,
      },
    ];

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Health checks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reset' })).toBeInTheDocument();

    await press(user, 'Run Re-match against the catalogue');

    expect(onRun).toHaveBeenCalledWith('catalogue.rematch');
  });

  it('says a server-wide job is running, tracked under its own kind', () => {
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'catalogue.rematch',
        label: sayVerbatim('Re-match against the catalogue'),
        description: sayVerbatim('Retries metadata matching for every item on the server.'),
        needsLibrary: false,
        destructive: false,
        takesParts: false,
        group: 'library',
        runsByHand: true,
        schedulable: true,
      },
    ];
    const progress = new Map<string, ScanEntry>([
      [
        'catalogue.rematch',
        {
          libraryId: 'lib-movies',
          kind: 'catalogue.rematch',
          phase: null,
          processed: 3,
          total: 10,
          item: null,
          jobId: 'job-1',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Run Re-match against the catalogue' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Stop Re-match against the catalogue' }),
    ).toBeInTheDocument();
  });

  it('draws no heading for a group with no jobs in it', () => {
    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        schedules={new Map()}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'Housekeeping' })).not.toBeInTheDocument();
  });

  it('reflects a job in the transcoder queue once its correlation id matches exactly', async () => {
    const user = userEvent.setup();
    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.regeneratePreviews',
          phase: 'previews',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-42',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        schedules={new Map()}
        working={[
          {
            id: 1,
            kind: 'preview',
            subject: 'Movie.mkv',
            state: 'running',
            queuedAtMs: 0,
            startedAtMs: 0,
            finishedAtMs: null,
            correlationId: 'job-42',
            stoppedBecause: null,
            failure: null,
          },
        ]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /is doing/ }));

    expect(await screen.findByText('Movie.mkv')).toBeInTheDocument();
  });

  it('does not guess a match from the queue kind alone, only from the correlation id', async () => {
    const user = userEvent.setup();
    const progress = new Map<string, ScanEntry>([
      [
        'lib-movies',
        {
          libraryId: 'lib-movies',
          kind: 'library.regeneratePreviews',
          phase: 'previews',
          processed: 1,
          total: 4,
          item: null,
          jobId: 'job-42',
          isStopping: false,
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        schedules={new Map()}
        working={[
          {
            id: 1,
            kind: 'preview',
            subject: 'Unrelated.mkv',
            state: 'running',
            queuedAtMs: 0,
            startedAtMs: 0,
            finishedAtMs: null,
            correlationId: 'some-other-job',
            stoppedBecause: null,
            failure: null,
          },
        ]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /is doing/ }));

    expect(await screen.findByText('Nothing is queued for it yet.')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated.mkv')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobRunner.displayName).toBe('JobRunner');
  });
});

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
    label: 'Scan for changes',
    description: 'Finds new, changed and removed files.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
  },
  {
    kind: 'library.regeneratePreviews',
    label: 'Generate missing previews',
    description: 'Renders preview clips for items that have none.',
    needsLibrary: true,
    destructive: false,
    takesParts: false,
  },
  {
    kind: 'library.reset',
    label: 'Reset and rebuild',
    description: 'Deletes everything in every library, then scans it from nothing.',
    needsLibrary: true,
    destructive: true,
    takesParts: false,
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
};

/**
 * Chooses something from a job's actions menu.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, job: string, action: RegExp) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${job}` }));
  await user.click(await screen.findByRole('menuitem', { name: action }));
};

describe('JobRunner', () => {
  it('lists every job an admin can start', () => {
    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
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
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Scan for changes', /Run now/);

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
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Scan for changes', /Run now/);
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
            label: 'Clear and fetch again',
            description: 'Erases the chosen parts of a library.',
            needsLibrary: true,
            destructive: true,
            takesParts: true,
          },
        ]}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Actions for Clear and fetch again' }),
    );

    expect(screen.queryByRole('menuitem', { name: /Edit schedule/ })).not.toBeInTheDocument();

    await user.click(await screen.findByRole('menuitem', { name: /Run now/ }));
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
            label: 'Prune old viewing history',
            description: 'Forgets viewings older than a year.',
            needsLibrary: false,
            destructive: true,
            takesParts: false,
          },
        ]}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Prune old viewing history', /Run now/);

    expect(onRun).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Prune old viewing history' }));

    expect(onRun).toHaveBeenCalledWith('history.prune');
  });

  it('opens the schedule page when a row is pressed anywhere but Run', async () => {
    const onOpenSchedule = vi.fn();
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={onOpenSchedule}
      />,
    );

    await choose(user, 'Scan for changes', /Edit schedule/);

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
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Reset and rebuild', /Run now/);

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
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Reset and rebuild', /Run now/);
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
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Reset and rebuild', /Run now/);
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getByText('Running')).toBeInTheDocument();
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES, shows]}
        progress={progress}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Running')).toHaveLength(1);
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        onRun={vi.fn()}
        onStop={onStop}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Scan for changes', /Stop it/);

    expect(onStop).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Stop it' }));

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
              },
            ],
          ])
        }
        working={[]}
        onRun={vi.fn()}
        onStop={onStop}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Scan for changes', /Stop it/);
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
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Reset and rebuild', /Run now/);

    expect(screen.getByRole('button', { name: 'Reset and rebuild on every library' })).toHaveClass(
      'bg-danger',
    );
  });

  it('does not offer to stop a job that is not running', async () => {
    const user = userEvent.setup();

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Actions for Scan for changes' }));

    expect(screen.queryByRole('menuitem', { name: /Stop it/ })).not.toBeInTheDocument();
  });

  it('refuses to start another job while one is going', async () => {
    const user = userEvent.setup();

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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: 'Actions for Generate missing previews' }),
    );

    expect(await screen.findByRole('menuitem', { name: /Run now/ })).toHaveAttribute(
      'data-disabled',
    );
  });

  it('still runs a server-wide job while a library is busy, which is when it is wanted most', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'server.checkTranscoder',
        label: 'Check the transcoder',
        description: 'Asks the transcoder whether it is still answering.',
        needsLibrary: false,
        destructive: false,
        takesParts: false,
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await choose(user, 'Check the transcoder', /Run now/);

    expect(onRun).toHaveBeenCalledWith('server.checkTranscoder');
  });

  it('says which jobs are server-wide rather than about the libraries', async () => {
    const onRun = vi.fn();
    const user = userEvent.setup();
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'catalogue.rematch',
        label: 'Re-match against the catalogue',
        description: 'Retries metadata matching for every item on the server.',
        needsLibrary: false,
        destructive: false,
        takesParts: false,
      },
    ];

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={onRun}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.getAllByText('Server').length).toBeGreaterThan(0);

    await choose(user, 'Re-match against the catalogue', /Run now/);

    expect(onRun).toHaveBeenCalledWith('catalogue.rematch');
  });

  it('says a server-wide job is running, tracked under its own kind', () => {
    const definitions: JobDefinition[] = [
      ...DEFINITIONS,
      {
        kind: 'catalogue.rematch',
        label: 'Re-match against the catalogue',
        description: 'Retries metadata matching for every item on the server.',
        needsLibrary: false,
        destructive: false,
        takesParts: false,
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={definitions}
        libraries={[MOVIES]}
        progress={progress}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Run Re-match against the catalogue' })).toBeNull();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('has no server-wide section when every job needs a library', () => {
    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={new Map()}
        working={[]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    expect(screen.queryByText('Server-wide')).not.toBeInTheDocument();
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
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
        },
      ],
    ]);

    render(
      <JobRunner
        definitions={DEFINITIONS}
        libraries={[MOVIES]}
        progress={progress}
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
            failure: null,
          },
        ]}
        onRun={vi.fn()}
        onStop={vi.fn()}
        onOpenSchedule={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /is doing/ }));

    expect(await screen.findByText('Nothing in the queue is tied to it yet.')).toBeInTheDocument();
    expect(screen.queryByText('Unrelated.mkv')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobRunner.displayName).toBe('JobRunner');
  });
});

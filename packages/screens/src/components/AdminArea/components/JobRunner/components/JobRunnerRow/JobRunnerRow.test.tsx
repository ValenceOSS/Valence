import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobRunnerRow } from './JobRunnerRow';
import type { JobDefinition } from '@ValenceClient/admin/fetchAdmin';
import type { JobRunnerRowProps } from './JobRunnerRow.types';

const SCAN: JobDefinition = {
  kind: 'library.scan',
  label: sayVerbatim('Scan for changes'),
  description: sayVerbatim('Finds new, changed and removed files.'),
  needsLibrary: true,
  destructive: false,
  takesParts: false,
  group: 'library',
  runsByHand: true,
  schedulable: true,
};

const NOW = Date.parse('2026-09-28T14:00:00.000Z');

/**
 * Draws a row as the job list does, with anything overridden.
 */
const draw = (overrides: Partial<JobRunnerRowProps> = {}) => {
  const props: JobRunnerRowProps = {
    definition: SCAN,
    triggers: [],
    nextRunAt: null,
    now: NOW,
    summary: null,
    isRunBlocked: false,
    onRun: vi.fn(),
    onStop: vi.fn(),
    onWatch: vi.fn(),
    onOpenSchedule: vi.fn(),
    ...overrides,
  };

  render(
    <ul>
      <JobRunnerRow {...props} />
    </ul>,
  );

  return props;
};

describe('JobRunnerRow', () => {
  it('says what a job does, when it runs, and how long until it next does', () => {
    draw({
      triggers: [{ id: 't1', trigger: { kind: 'daily', hour: 3, minute: 0 } }],
      nextRunAt: NOW + 4 * 60_000 + 7_000,
    });

    expect(screen.getByText('Finds new, changed and removed files.')).toBeInTheDocument();
    expect(screen.getByText('Daily at 03:00')).toBeInTheDocument();
    expect(screen.getByText('in 4m 07s')).toBeInTheDocument();
  });

  it('runs the job from its Run button, and opens its schedule from the schedule', async () => {
    const user = userEvent.setup();
    const props = draw();

    await user.click(screen.getByRole('button', { name: 'Run Scan for changes' }));
    await user.click(
      screen.getByRole('button', { name: 'Edit the schedule for Scan for changes' }),
    );

    expect(props.onRun).toHaveBeenCalledWith(SCAN);
    expect(props.onOpenSchedule).toHaveBeenCalledWith('library.scan');
  });

  it('says a job that cannot be scheduled is run by hand only', () => {
    draw({ definition: { ...SCAN, schedulable: false } });

    expect(screen.getByText('Run by hand only')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit the schedule for Scan for changes' }),
    ).not.toBeInTheDocument();
  });

  it('shows how far a running job has got in place of what it does, with a way to stop it', async () => {
    const user = userEvent.setup();
    const props = draw({
      summary: { phase: 'probing', processed: 3, total: 10, item: null, isStopping: false },
    });

    expect(screen.queryByText('Finds new, changed and removed files.')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stop Scan for changes' }));

    expect(props.onStop).toHaveBeenCalledWith(SCAN);
  });

  it('will not start a job that has to wait for other work on a library', () => {
    draw({ isRunBlocked: true });

    expect(screen.getByRole('button', { name: 'Run Scan for changes' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(JobRunnerRow.displayName).toBe('JobRunnerRow');
  });
});

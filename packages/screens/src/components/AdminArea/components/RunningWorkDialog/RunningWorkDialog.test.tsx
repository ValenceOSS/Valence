import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RunningWorkDialog } from './RunningWorkDialog';
import type { Job } from '@ValenceClient/admin/fetchAdmin';

const task = (overrides: Partial<Job> = {}): Job => ({
  id: 1,
  kind: 'preview',
  subject: 'Movie.mkv',
  state: 'running',
  queuedAtMs: 0,
  startedAtMs: 0,
  finishedAtMs: null,
  correlationId: 'run-1',
  failure: null,
  ...overrides,
});

describe('RunningWorkDialog', () => {
  it('lists each task the job has in the queue by what it is working on', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={null}
        tasks={[task(), task({ id: 2, subject: 'Other.mkv', state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Movie.mkv')).toBeInTheDocument();
    expect(screen.getByText('Other.mkv')).toBeInTheDocument();
  });

  it('counts what is running and what is waiting', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={null}
        tasks={[task(), task({ id: 2, state: 'queued' }), task({ id: 3, state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('1 running · 2 waiting')).toBeInTheDocument();
  });

  it('says so when nothing in the queue is tied to the job', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={null}
        tasks={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Nothing in the queue is tied to it yet.')).toBeInTheDocument();
  });

  it('shows how far along the job says it is', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={{ phase: 'previews', processed: 13, total: 107 }}
        tasks={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '13');
  });

  it('shows nothing while closed', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen={false}
        progress={null}
        tasks={[task()]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Movie.mkv')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RunningWorkDialog.displayName).toBe('RunningWorkDialog');
  });
});

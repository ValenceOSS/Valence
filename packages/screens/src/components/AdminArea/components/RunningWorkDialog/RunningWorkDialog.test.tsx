import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { runQueuedJobNow } from '@ValenceClient/admin/fetchAdmin';
import { RunningWorkDialog } from './RunningWorkDialog';
import type { Job } from '@ValenceClient/admin/fetchAdmin';

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({
  runQueuedJobNow: vi.fn().mockResolvedValue(true),
}));

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
        progress={[]}
        tasks={[task(), task({ id: 2, subject: 'Other.mkv', state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Movie.mkv')).toBeInTheDocument();
    expect(screen.getByText('Other.mkv')).toBeInTheDocument();
  });

  it('offers to start a waiting task now, past the limit, and only a waiting one', async () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={[]}
        tasks={[task({ id: 1 }), task({ id: 2, subject: 'Other.mkv', state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: /now$/ })).toHaveLength(1);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Run Other.mkv now' }));

    expect(runQueuedJobNow).toHaveBeenCalledWith(2);
  });

  it('says a job that has been asked to stop is finishing what it began, and leaving the rest', () => {
    render(
      <RunningWorkDialog
        title="Scan Movies"
        isOpen
        progress={[
          { label: 'Scan Movies', phase: 'probing', processed: 3, total: 10, isStopping: true },
        ]}
        tasks={[task()]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Stopping')).toBeInTheDocument();
    expect(screen.getByText(/Finishing what it has already started/)).toBeInTheDocument();
  });

  it('counts what is running and what is waiting', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={[]}
        tasks={[task(), task({ id: 2, state: 'queued' }), task({ id: 3, state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('1 running').parentElement).toHaveTextContent('1 running · 2 waiting');
  });

  it('says so when nothing in the queue is tied to the job', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen
        progress={[]}
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
        progress={[{ label: 'Previews', phase: 'previews', processed: 13, total: 107 }]}
        tasks={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '13');
  });

  it('shows a bar for each piece of work, named, when there is more than one', () => {
    render(
      <RunningWorkDialog
        title="Movies"
        isOpen
        progress={[
          { label: 'Regenerating previews for Movies', phase: 'previews', processed: 1, total: 4 },
          {
            label: 'Regenerating thumbnails for Movies',
            phase: 'trickplay',
            processed: 2,
            total: 4,
          },
        ]}
        tasks={[]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.getByText('Regenerating thumbnails for Movies')).toBeInTheDocument();
  });

  it('does not count finished tasks as waiting', () => {
    render(
      <RunningWorkDialog
        title="Scrubs"
        isOpen
        progress={[]}
        tasks={[task(), task({ id: 2, state: 'finished' }), task({ id: 3, state: 'finished' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('1 running').parentElement).toHaveTextContent('1 running · 0 waiting');
  });

  it('draws a task waiting in the queue as a gray waiting badge', () => {
    render(
      <RunningWorkDialog
        title="Scrubs"
        isOpen
        progress={[]}
        tasks={[task({ id: 2, subject: 'Later.mkv', state: 'queued' })]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Waiting')).toHaveClass('bg-[var(--surface-hover)]');
  });

  it('says how many are still to come that the queue has not been given yet', () => {
    render(
      <RunningWorkDialog
        title="Scrubs"
        isOpen
        progress={[{ label: 'Scrubs', phase: 'trickplay', processed: 16, total: 107 }]}
        tasks={[task()]}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('90 more not started yet')).toBeInTheDocument();
    expect(screen.getByText('1 running').parentElement).toHaveTextContent('1 running · 90 waiting');
  });

  it('shows nothing while closed', () => {
    render(
      <RunningWorkDialog
        title="Generate missing previews"
        isOpen={false}
        progress={[]}
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

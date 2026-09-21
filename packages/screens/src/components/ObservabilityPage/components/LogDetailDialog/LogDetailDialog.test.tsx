import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LogDetailDialog } from './LogDetailDialog';
import type { LogRecord } from '@ValenceContracts/schemas/Log';

const RECORD: LogRecord = {
  id: 'one',
  atMs: new Date(2026, 8, 21, 14, 3, 9).getTime(),
  level: 'error',
  source: 'scanner',
  message: 'Could not read /films/a.mkv',
  detail: 'at readFile()',
  count: 3,
  context: {
    jobId: 'job-1',
    jobKind: null,
    libraryId: 'lib-1',
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
};

describe('LogDetailDialog', () => {
  it('says everything known about the record', () => {
    render(<LogDetailDialog record={RECORD} isOpen onClose={vi.fn()} />);

    expect(screen.getByText('Could not read /films/a.mkv')).toBeInTheDocument();
    expect(screen.getByText('at readFile()')).toBeInTheDocument();
    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('scanner')).toBeInTheDocument();
    expect(screen.getByText('3 times')).toBeInTheDocument();
    expect(screen.getByText('lib-1')).toBeInTheDocument();
  });

  it('does not say how often a record happened that happened once', () => {
    render(<LogDetailDialog record={{ ...RECORD, count: 1 }} isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Happened')).not.toBeInTheDocument();
  });

  it('turns a job’s id into a way to follow it, where somebody is listening', async () => {
    const onOpenJob = vi.fn();

    render(<LogDetailDialog record={RECORD} isOpen onClose={vi.fn()} onOpenJob={onOpenJob} />);
    await userEvent.click(screen.getByRole('button', { name: 'job-1' }));

    expect(onOpenJob).toHaveBeenCalledWith('job-1');
  });

  it('only reads the job’s id where nobody is listening', () => {
    render(<LogDetailDialog record={RECORD} isOpen onClose={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'job-1' })).not.toBeInTheDocument();
    expect(screen.getByText('job-1')).toBeInTheDocument();
  });

  it('closes', async () => {
    const onClose = vi.fn();

    render(<LogDetailDialog record={RECORD} isOpen onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows nothing where there is no record', () => {
    render(<LogDetailDialog record={null} isOpen onClose={vi.fn()} />);

    expect(screen.queryByText('Log record')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LogDetailDialog.displayName).toBe('LogDetailDialog');
  });
});

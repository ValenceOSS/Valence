import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LogLine } from './LogLine';
import type { LogLineProps } from './LogLine.types';
import type { LogRecord } from '@ValenceContracts/schemas/Log';

const RECORD: LogRecord = {
  id: 'one',
  atMs: new Date(2026, 8, 21, 14, 3, 9).getTime(),
  level: 'error',
  source: 'scanner',
  message: 'Could not read /films/a.mkv',
  detail: 'at readFile()',
  count: 40,
  context: {
    jobId: 'job-abcdef123',
    jobKind: 'library.scan',
    libraryId: 'lib-1',
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
};

const draw = (over: Partial<LogLineProps> = {}) => {
  const handlers = {
    onToggle: vi.fn(),
    onFilter: vi.fn(),
    onOpen: vi.fn(),
    onCopy: vi.fn(),
    onTrace: vi.fn(),
    describeKind: (kind: string) => (kind === 'library.scan' ? 'Scan for changes' : kind),
  };

  render(
    <ul>
      <LogLine
        record={RECORD}
        isExpanded={false}
        isWrapped={false}
        hasTime
        {...handlers}
        {...over}
      />
    </ul>,
  );

  return handlers;
};

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Actions for this line' }));
};

describe('LogLine', () => {
  it('says when, how serious, where from, what and how often, in one line', () => {
    draw();

    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('scanner')).toBeInTheDocument();
    expect(screen.getByText('Could not read /films/a.mkv')).toBeInTheDocument();
    expect(screen.getByText('×40')).toBeInTheDocument();
    expect(document.querySelector('time')).toHaveTextContent(/\d\d:03:09/);
  });

  it('leaves out the time where it was turned off, and the count of a line seen once', () => {
    draw({ hasTime: false, record: { ...RECORD, count: 1 } });

    expect(document.querySelector('time')).toBeNull();
    expect(screen.queryByText(/^×/)).not.toBeInTheDocument();
  });

  it('opens and closes when pressed, saying whether it is open', async () => {
    const { onToggle } = draw();
    const line = screen.getByRole('button', { name: /Could not read/ });

    expect(line).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(line);

    expect(onToggle).toHaveBeenCalled();
  });

  it('shows the detail and where the line came from once open', () => {
    draw({ isExpanded: true });

    expect(screen.getByText('at readFile()')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Where this line came from' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Narrow the log to Job job-abcdef123/ }),
    ).toBeVisible();
  });

  it('shows neither while closed', () => {
    draw();

    expect(screen.queryByText('at readFile()')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('list', { name: 'Where this line came from' }),
    ).not.toBeInTheDocument();
  });

  it('narrows the log to an identifier pressed in the open line', async () => {
    const { onFilter } = draw({ isExpanded: true });

    await userEvent.click(screen.getByRole('button', { name: /Narrow the log to Library lib-1/ }));

    expect(onFilter).toHaveBeenCalledWith('library:lib-1');
  });

  it('cuts a long message to a line unless wrapping is on or the line is open', () => {
    draw();

    expect(screen.getByText('Could not read /films/a.mkv')).toHaveClass('truncate');
  });

  it('wraps a long message where the explorer wraps', () => {
    draw({ isWrapped: true });

    expect(screen.getByText('Could not read /films/a.mkv')).toHaveClass('whitespace-pre-wrap');
  });

  it('opens the record in full from its menu', async () => {
    const { onOpen } = draw();

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Show log details' }));

    expect(onOpen).toHaveBeenCalled();
  });

  it('copies the line from its menu', async () => {
    const { onCopy } = draw();

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Copy log line' }));

    expect(onCopy).toHaveBeenCalled();
  });

  it('narrows the log to its level, its source and each identifier it carries from its menu', async () => {
    const { onFilter } = draw();

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: 'Only error lines' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Only scanner' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Job job-abcd…' })).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Kind of job Scan for changes' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /^Media/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('menuitem', { name: 'Only scanner' }));

    expect(onFilter).toHaveBeenCalledWith('source:scanner');
  });

  it('traces the job the line belongs to', async () => {
    const { onTrace } = draw();

    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Trace this job' }));

    expect(onTrace).toHaveBeenCalledWith('job-abcdef123');
  });

  it('offers no trace for a line that belongs to no job', async () => {
    draw({ record: { ...RECORD, context: { ...RECORD.context, jobId: null } } });

    await openMenu();
    await screen.findByRole('menuitem', { name: 'Copy log line' });

    expect(screen.queryByRole('menuitem', { name: 'Trace this job' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LogLine.displayName).toBe('LogLine');
  });
});

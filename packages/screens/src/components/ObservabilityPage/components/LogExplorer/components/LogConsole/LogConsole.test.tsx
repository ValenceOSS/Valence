import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LogRecord } from '@ValenceContracts/schemas/Log';
import { LogConsole } from './LogConsole';

const aRecord = (change: Partial<LogRecord> = {}): LogRecord => ({
  id: 'one',
  atMs: new Date(2026, 8, 21, 14, 3, 9).getTime(),
  level: 'info',
  source: 'scanner',
  message: 'Scanned the films',
  detail: null,
  count: 1,
  context: {
    jobId: null,
    jobKind: null,
    libraryId: null,
    mediaId: null,
    sessionId: null,
    requestId: null,
  },
  ...change,
});

describe('LogConsole', () => {
  it('prints each line numbered, with its level, where it came from and what it said', () => {
    render(<LogConsole records={[aRecord()]} isWrapped={false} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Scanned the films/u)).toBeInTheDocument();
    expect(screen.getByText(/^info/u)).toHaveClass('uppercase');
  });

  it('tints a warning and an error the length of the line', () => {
    render(
      <LogConsole
        records={[
          aRecord({ id: 'w', level: 'warn', message: 'slow' }),
          aRecord({ id: 'e', level: 'error', message: 'broke' }),
        ]}
        isWrapped={false}
      />,
    );

    const [warning, error] = screen.getAllByRole('listitem');

    expect(warning).toHaveClass('bg-highlight/[0.08]');
    expect(error).toHaveClass('bg-danger/[0.08]');
  });

  it('wraps long lines only where asked to', () => {
    const { rerender } = render(<LogConsole records={[aRecord()]} isWrapped={false} />);

    expect(screen.getByText(/Scanned the films/u)).toHaveClass('whitespace-pre');

    rerender(<LogConsole records={[aRecord()]} isWrapped />);

    expect(screen.getByText(/Scanned the films/u)).toHaveClass('whitespace-pre-wrap');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LogConsole.displayName).toBe('LogConsole');
  });
});

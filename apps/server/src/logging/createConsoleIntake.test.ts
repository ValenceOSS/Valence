import { describe, expect, it } from 'vitest';
import type { LogSource } from '@ValenceContracts/schemas/Log';
import type { Logger } from './Logger';
import { createConsoleIntake } from './createConsoleIntake';

/**
 * A logger that keeps what it was told.
 */
const aLogger = () => {
  const said: { level: string; source: LogSource; message: string; isQuiet: boolean }[] = [];
  const keep =
    (level: string) => (source: LogSource, message: string, aside?: { isQuiet?: boolean }) => {
      said.push({ level, source, message, isQuiet: aside?.isQuiet ?? false });
    };
  const log: Logger = {
    debug: keep('debug'),
    info: keep('info'),
    warn: keep('warn'),
    error: keep('error'),
    about: () => log,
    flush: () => Promise.resolve(),
  };

  return { log, said };
};

describe('createConsoleIntake', () => {
  it('writes each line into the log under the service’s name, quietly and in order', () => {
    const { log, said } = aLogger();

    createConsoleIntake(log, 'requests').take([
      { atMs: 2, level: 'warn', message: 'second' },
      { atMs: 1, level: 'info', message: 'first' },
    ]);

    expect(said).toEqual([
      { level: 'info', source: 'requests', message: 'first', isQuiet: true },
      { level: 'warn', source: 'requests', message: 'second', isQuiet: true },
    ]);
  });

  it('keeps only lines newer than the last taken', () => {
    const { log, said } = aLogger();
    const intake = createConsoleIntake(log, 'requests');

    intake.take([{ atMs: 1, level: 'info', message: 'old' }]);
    intake.take([
      { atMs: 1, level: 'info', message: 'old' },
      { atMs: 5, level: 'error', message: 'new' },
    ]);

    expect(said.map((line) => line.message)).toEqual(['old', 'new']);
  });

  it('takes nothing from an empty reading', () => {
    const { log, said } = aLogger();

    createConsoleIntake(log, 'requests').take([]);

    expect(said).toEqual([]);
  });
});

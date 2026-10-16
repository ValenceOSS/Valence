import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureConsole } from './captureConsole';
import type { ConsoleStream } from './captureConsole';

let written = {
  stdout: vi.spyOn(process.stdout, 'write'),
  stderr: vi.spyOn(process.stderr, 'write'),
};

beforeEach(() => {
  written = {
    stdout: vi.spyOn(process.stdout, 'write').mockImplementation(() => true),
    stderr: vi.spyOn(process.stderr, 'write').mockImplementation(() => true),
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Captures the console and keeps what it hears.
 */
const listen = () => {
  const heard: { line: string; stream: ConsoleStream }[] = [];
  const captured = captureConsole((line, stream) => {
    heard.push({ line, stream });
  });

  return { heard, captured };
};

describe('captureConsole', () => {
  it('hears each line written to either stream', () => {
    const { heard } = listen();

    process.stdout.write('one\ntwo\n');
    process.stderr.write('oops\n');

    expect(heard).toEqual([
      { line: 'one', stream: 'stdout' },
      { line: 'two', stream: 'stdout' },
      { line: 'oops', stream: 'stderr' },
    ]);
  });

  it('still writes to the console as before', () => {
    listen();

    process.stdout.write('kept\n');

    expect(written.stdout).toHaveBeenCalledWith('kept\n', undefined, undefined);
  });

  it('waits for the end of a line written in pieces', () => {
    const { heard } = listen();

    process.stdout.write('half ');
    expect(heard).toEqual([]);

    process.stdout.write(new TextEncoder().encode('a line\n'));
    expect(heard).toEqual([{ line: 'half a line', stream: 'stdout' }]);
  });

  it('passes over blank lines', () => {
    const { heard } = listen();

    process.stdout.write('\n   \n');

    expect(heard).toEqual([]);
  });

  it('does not hear what the logger writes itself', () => {
    const { heard, captured } = listen();

    captured.asOwn(() => {
      process.stdout.write('from the logger\n');
    });
    process.stdout.write('from a library\n');

    expect(heard).toEqual([{ line: 'from a library', stream: 'stdout' }]);
  });

  it('hears again after the logger’s write throws', () => {
    const { heard, captured } = listen();

    expect(() => {
      captured.asOwn(() => {
        throw new Error('broken');
      });
    }).toThrow('broken');

    process.stdout.write('after\n');

    expect(heard).toEqual([{ line: 'after', stream: 'stdout' }]);
  });

  it('passes a callback given in place of an encoding through', () => {
    listen();
    const done = vi.fn();

    process.stdout.write('x\n', done);

    expect(written.stdout).toHaveBeenCalledWith('x\n', done);
  });
});

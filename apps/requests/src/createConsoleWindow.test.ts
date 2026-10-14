import { describe, expect, it } from 'vitest';
import { createConsoleWindow } from './createConsoleWindow';

describe('createConsoleWindow', () => {
  it('keeps each line with when it was written and how serious it is', () => {
    const window = createConsoleWindow(() => 42);

    window.add('started');
    window.add('slow', 'warn');

    expect(window.read()).toEqual([
      { atMs: 42, level: 'info', message: 'started' },
      { atMs: 42, level: 'warn', message: 'slow' },
    ]);
  });

  it('keeps only the newest five hundred lines', () => {
    const window = createConsoleWindow(() => 0);

    for (let line = 0; line < 510; line += 1) {
      window.add(`line ${line.toString()}`);
    }

    const kept = window.read();

    expect(kept).toHaveLength(500);
    expect(kept[0]?.message).toBe('line 10');
  });

  it('hands out a copy, so a reader cannot change what is kept', () => {
    const window = createConsoleWindow(() => 0);

    window.add('kept');
    window.read().pop();

    expect(window.read()).toHaveLength(1);
  });
});

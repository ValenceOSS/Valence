import { describe, expect, it } from 'vitest';
import { ServiceConsoleSchema } from './ServiceConsole';

describe('ServiceConsoleSchema', () => {
  it('reads the lines a service has written to its console', () => {
    expect(
      ServiceConsoleSchema.parse({ lines: [{ atMs: 1, level: 'warn', message: 'slow' }] }).lines,
    ).toEqual([{ atMs: 1, level: 'warn', message: 'slow' }]);
  });

  it('refuses a level a console line cannot have', () => {
    expect(
      ServiceConsoleSchema.safeParse({ lines: [{ atMs: 1, level: 'debug', message: 'x' }] })
        .success,
    ).toBe(false);
  });
});

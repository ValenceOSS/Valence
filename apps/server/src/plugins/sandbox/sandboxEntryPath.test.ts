import { describe, expect, it } from 'vitest';
import { sandboxEntryPath } from './sandboxEntryPath';

describe('where a plugin sandbox runs from', () => {
  it('names the sandbox entry and only what it needs to read', () => {
    const { entry, readable } = sandboxEntryPath();

    expect(entry).toMatch(/apps\/server\/src\/plugins\/sandbox\/runPluginSandbox\.ts$/);
    expect(readable[0]).toMatch(/src\/plugins\/sandbox$/);
    expect(readable[1]).toMatch(/apps\/server\/package\.json$/);
    expect(readable.slice(2).every((path) => path.endsWith('node_modules'))).toBe(true);
  });

  it('refuses to guess when it is not inside the server', () => {
    expect(() => sandboxEntryPath('/tmp/nowhere/file.ts')).toThrow('could not find its own folder');
  });
});

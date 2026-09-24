import { describe, expect, it } from 'vitest';
import { diskRefusalOf } from './diskRefusalOf';

/**
 * An error carrying a filesystem code, as Node throws one.
 *
 * @param code - The code.
 * @returns The error.
 */
const thrown = (code: string): Error => Object.assign(new Error(code), { code });

describe('diskRefusalOf', () => {
  it.each([
    ['ENOENT', 'missing'],
    ['ENOTDIR', 'missing'],
    ['EROFS', 'readOnly'],
    ['EACCES', 'denied'],
    ['EPERM', 'denied'],
    ['EIO', 'failed'],
  ])('reads %s as %s', (code, kind) => {
    expect(diskRefusalOf(thrown(code))).toEqual({ kind });
  });

  it('reads an error with no code, or nothing, as a failure', () => {
    expect(diskRefusalOf(new Error('no code'))).toEqual({ kind: 'failed' });
    expect(diskRefusalOf(null)).toEqual({ kind: 'failed' });
  });
});

import { describe, expect, it } from 'vitest';
import { LibraryLockRequestSchema, LibraryLocksSchema } from './LibraryLock';

describe('LibraryLockRequestSchema', () => {
  it('reads a lock, relocking after an hour unless told otherwise', () => {
    expect(LibraryLockRequestSchema.parse({ secret: '2468' })).toEqual({
      secret: '2468',
      relockMinutes: 60,
    });
  });

  it('reads taking a lock away', () => {
    expect(LibraryLockRequestSchema.parse({ secret: null }).secret).toBeNull();
  });

  it('refuses a secret too short to keep anybody out', () => {
    expect(LibraryLockRequestSchema.safeParse({ secret: '12' }).success).toBe(false);
  });
});

describe('LibraryLocksSchema', () => {
  it('reads the locks kept, library by library', () => {
    expect(LibraryLocksSchema.parse({ a: { hash: 'h', relockMinutes: 30 } })).toEqual({
      a: { hash: 'h', relockMinutes: 30 },
    });
  });
});

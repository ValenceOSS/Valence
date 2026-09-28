import { describe, expect, it } from 'vitest';
import { permissionsHashOf } from './permissionsHashOf';

describe('permissionsHashOf', () => {
  it('is the same for the same permissions, and different for any change', () => {
    const storage = { kind: 'storage' as const, quotaBytes: 1024 };

    expect(permissionsHashOf([storage])).toBe(permissionsHashOf([{ ...storage }]));
    expect(permissionsHashOf([storage])).not.toBe(
      permissionsHashOf([{ ...storage, quotaBytes: 2048 }]),
    );
    expect(permissionsHashOf([])).toMatch(/^[0-9a-f]{32}$/);
  });
});

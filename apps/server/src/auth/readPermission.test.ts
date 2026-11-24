import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import { readPermission } from './readPermission';

describe('readPermission', () => {
  it('reads back every permission the catalogue has', () => {
    for (const permission of PERMISSIONS) {
      expect(readPermission(permission)).toBe(permission);
    }
  });

  it('reads a permission since folded into another as the one it became', () => {
    expect(readPermission('server.logs')).toBe('server.monitor');
    expect(readPermission('library.create')).toBe('library.edit');
  });

  it('reads nothing for a retired name whose successor does more than it did', () => {
    for (const widening of [
      'account.ban',
      'account.security',
      'account.profiles',
      'server.webhooks',
    ]) {
      expect(readPermission(widening)).toBeNull();
    }
  });

  it('refuses a name the catalogue no longer has', () => {
    expect(readPermission('library.summon')).toBeNull();
  });

  it('refuses a name from a permission that was renamed away', () => {
    expect(readPermission('library.view')).toBeNull();
  });

  it('refuses an empty column', () => {
    expect(readPermission('')).toBeNull();
  });

  it('does not accept a permission by its prefix alone', () => {
    expect(readPermission('library')).toBeNull();
    expect(readPermission('jobs')).toBeNull();
  });

  it('is exact about case, so a hand-edited row does not quietly work', () => {
    expect(readPermission('Administrator')).toBeNull();
    expect(readPermission('JOBS.RUN')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import { describePermission } from './describePermission';

describe('describePermission', () => {
  it('has words for every permission in the catalogue', () => {
    for (const permission of PERMISSIONS) {
      expect(describePermission(permission)).toBeTruthy();
    }
  });

  it('says what is destroyed rather than that something is', () => {
    expect(describePermission('jobs.runDestructive')).toBe('Reset and rebuild');
  });

  it('never answers with the identifier it was given', () => {
    for (const permission of PERMISSIONS) {
      expect(describePermission(permission)).not.toBe(permission);
    }
  });

  it('calls administrator everything', () => {
    expect(describePermission('administrator')).toBe('Everything');
  });

  it('names each permission differently, so no two rows of a role read the same', () => {
    const labels = PERMISSIONS.map((permission) => describePermission(permission));

    expect(new Set(labels).size).toBe(labels.length);
  });
});

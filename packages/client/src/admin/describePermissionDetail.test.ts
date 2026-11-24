import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@ValenceContracts/schemas/Permission';
import { describePermission } from './describePermission';
import { describePermissionDetail } from './describePermissionDetail';

describe('describePermissionDetail', () => {
  it('has a sentence for every permission in the catalogue', () => {
    for (const permission of PERMISSIONS) {
      expect(describePermissionDetail(permission)).toBeTruthy();
    }
  });

  it('says more than the label does', () => {
    for (const permission of PERMISSIONS) {
      expect(describePermissionDetail(permission)).not.toBe(describePermission(permission));
    }
  });

  it('says administrator implies what has not been written yet', () => {
    expect(describePermissionDetail('administrator')).toContain('added in future updates');
  });

  it('says what the permissions that took over retired ones now cover', () => {
    expect(describePermissionDetail('streaming.control')).toContain('send a message');
    expect(describePermissionDetail('media.override')).toContain('rescan');
    expect(describePermissionDetail('server.monitor')).toContain('server log');
    expect(describePermissionDetail('account.manage')).toContain('manage their profiles');
  });
});

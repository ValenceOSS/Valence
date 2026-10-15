import { describe, expect, it } from 'vitest';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import { holdsMoreThanEveryProfile } from './holdsMoreThanEveryProfile';

describe('holdsMoreThanEveryProfile', () => {
  it('holds for nothing on an account that may do nothing', () => {
    expect(holdsMoreThanEveryProfile(new Set<GrantedPermission>())).toBe(false);
  });

  it('holds for nothing on an account that may only do what every profile may', () => {
    const everyday = new Set<GrantedPermission>([
      'sharing.link',
      'sharing.party',
      'download.media',
      'requests.ask',
      'requests.askMusic',
      'requests.viewAll',
    ]);

    expect(holdsMoreThanEveryProfile(everyday)).toBe(false);
  });

  it('holds for an account that may approve requests, manage people or run the server', () => {
    expect(holdsMoreThanEveryProfile(new Set<GrantedPermission>(['requests.approve']))).toBe(true);
    expect(
      holdsMoreThanEveryProfile(new Set<GrantedPermission>(['requests.ask', 'account.manage'])),
    ).toBe(true);
    expect(holdsMoreThanEveryProfile(new Set<GrantedPermission>(['administrator']))).toBe(true);
  });

  it('holds for an account granted something by a plugin', () => {
    expect(holdsMoreThanEveryProfile(new Set<GrantedPermission>(['plugin.trakt.sync']))).toBe(true);
  });
});

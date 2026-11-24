import { describe, expect, it } from 'vitest';
import { readGrantedPermission } from './readGrantedPermission';

describe('readGrantedPermission', () => {
  it('reads Valence’s own permissions and plugin nodes', () => {
    expect(readGrantedPermission('library.edit')).toBe('library.edit');
    expect(readGrantedPermission('plugin.anilist.sync')).toBe('plugin.anilist.sync');
  });

  it('reads a permission since folded into another as the one it became', () => {
    expect(readGrantedPermission('streaming.pause')).toBe('streaming.control');
  });

  it('reads nothing for a retired name whose successor does more than it did', () => {
    expect(readGrantedPermission('account.ban')).toBeNull();
    expect(readGrantedPermission('server.webhooks')).toBeNull();
  });

  it.each([
    'plugin.anilist',
    'plugin..sync',
    'plugin.A.sync',
    'library.anything',
    'plugin.anilist.sync.more',
  ])('refuses %s', (name) => {
    expect(readGrantedPermission(name)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { readGrantedPermission } from './readGrantedPermission';

describe('readGrantedPermission', () => {
  it('reads Valence’s own permissions and plugin nodes', () => {
    expect(readGrantedPermission('library.create')).toBe('library.create');
    expect(readGrantedPermission('plugin.anilist.sync')).toBe('plugin.anilist.sync');
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

import { describe, expect, it } from 'vitest';
import { namesOfPermission } from './namesOfPermission';

describe('namesOfPermission', () => {
  it('names a permission nothing was folded into by its own name alone', () => {
    expect(namesOfPermission('library.delete')).toStrictEqual(['library.delete']);
  });

  it('names its own name first, then every retired one that became it', () => {
    expect(namesOfPermission('media.override')).toStrictEqual([
      'media.override',
      'media.rescan',
      'media.artwork',
      'media.hide',
    ]);
  });

  it('names only the retired names that became that permission', () => {
    expect(namesOfPermission('server.settings')).toStrictEqual([
      'server.settings',
      'server.webhooks',
    ]);
  });
});

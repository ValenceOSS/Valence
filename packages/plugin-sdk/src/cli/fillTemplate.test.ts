import { describe, expect, it } from 'vitest';
import { fillTemplate } from './fillTemplate';

describe('fillTemplate', () => {
  it('fills every hole, escaping what goes in', () => {
    expect(
      fillTemplate('https://x.test/{id}-v{version}/{file}?again={id}', {
        id: 'anilist',
        version: '1.0.0',
        file: 'a b.vplugin',
      }),
    ).toBe('https://x.test/anilist-v1.0.0/a%20b.vplugin?again=anilist');
  });
});

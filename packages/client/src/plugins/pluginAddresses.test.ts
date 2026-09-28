import { describe, expect, it } from 'vitest';
import { pluginImageUrl } from './pluginImageUrl';
import { pluginPath } from './pluginPath';
import { surfacePathOf } from './surfacePathOf';

describe('plugin addresses', () => {
  it('escapes every part of a path', () => {
    expect(pluginPath('a/b', 'pages', '../x')).toBe('/api/plugins/a%2Fb/pages/..%2Fx');
  });

  it('names where a page and a panel are acted on', () => {
    expect(surfacePathOf({ kind: 'page', pluginId: 'p', pageId: 'home' }, true)).toBe(
      '/api/plugins/p/pages/home/act',
    );
    expect(
      surfacePathOf(
        { kind: 'panel', pluginId: 'p', panelId: 'x', on: 'album', subjectId: 'a' },
        true,
      ),
    ).toBe('/api/plugins/p/panels/x/act?kind=album&subject=a');
  });

  it('loads every picture from this server', () => {
    expect(pluginImageUrl('p', { kind: 'asset', name: 'logo.png' })).toBe(
      '/api/plugins/p/assets/logo.png',
    );
    expect(pluginImageUrl('p', { kind: 'remote', url: 'https://img.anili.st/a.png' })).toBe(
      '/api/plugins/p/image?url=https%3A%2F%2Fimg.anili.st%2Fa.png',
    );
    expect(
      pluginImageUrl('p', {
        kind: 'media',
        mediaId: '00000000-0000-4000-8000-000000000001',
        art: 'backdrop',
      }),
    ).toBe('/api/media/00000000-0000-4000-8000-000000000001/image/backdrop');
    expect(
      pluginImageUrl('p', {
        kind: 'media',
        mediaId: '00000000-0000-4000-8000-000000000001',
        art: 'cover',
      }),
    ).toBe('/api/media/00000000-0000-4000-8000-000000000001/image/poster');
  });
});

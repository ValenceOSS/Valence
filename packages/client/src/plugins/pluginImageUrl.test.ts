import { describe, expect, it } from 'vitest';
import { pluginImageUrl } from './pluginImageUrl';

const MEDIA_ID = '6f1c1c0e-3a2b-4c5d-9e8f-0a1b2c3d4e5f';

describe('pluginImageUrl', () => {
  it('serves a packed picture from the plugin', () => {
    expect(pluginImageUrl('anime', { kind: 'asset', name: 'cover.png' })).toBe(
      '/api/plugins/anime/assets/cover.png',
    );
  });

  it('fetches a remote picture through this server, narrowed where the plugin said so', () => {
    const remote = { kind: 'remote' as const, url: 'https://example.com/a.jpg' };

    expect(pluginImageUrl('anime', remote)).toBe(
      '/api/plugins/anime/image?url=https%3A%2F%2Fexample.com%2Fa.jpg',
    );
    expect(pluginImageUrl('anime', { ...remote, size: 'small' })).toBe(
      '/api/plugins/anime/image?url=https%3A%2F%2Fexample.com%2Fa.jpg&size=small',
    );
  });

  it('draws a title from its own artwork, narrowed where the plugin said so', () => {
    expect(pluginImageUrl('anime', { kind: 'media', mediaId: MEDIA_ID, art: 'backdrop' })).toBe(
      `/api/media/${MEDIA_ID}/image/backdrop`,
    );
    expect(
      pluginImageUrl('anime', { kind: 'media', mediaId: MEDIA_ID, art: 'cover', size: 'medium' }),
    ).toBe(`/api/media/${MEDIA_ID}/image/poster?size=medium`);
  });
});

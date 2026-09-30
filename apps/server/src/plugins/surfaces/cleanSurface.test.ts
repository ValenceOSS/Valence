import { describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { cleanSurface } from './cleanSurface';

const manifest = PluginManifestSchema.parse({
  manifestVersion: 2,
  id: 'surface-test',
  name: 'Surface Test',
  version: '1.0.0',
  apiVersion: '^1.0',
  author: { name: 'Tester' },
  description: 'Draws things.',
  permissions: [{ kind: 'network', hosts: ['img.example.com'] }],
  entry: 'dist/plugin.js',
});

const assets = new Set(['icon.png']);

const clean = (surface: object) => cleanSurface(JSON.stringify(surface), manifest, assets);

describe('checking a surface before a client sees it', () => {
  it('passes a well-made surface through', () => {
    const surface = {
      title: 'Anime',
      blocks: [
        { type: 'heading', text: 'Connected' },
        { type: 'image', image: { kind: 'asset', name: 'icon.png' }, alt: 'Icon' },
        {
          type: 'image',
          image: { kind: 'remote', url: 'https://img.example.com/a.png' },
          alt: 'Cover',
        },
        {
          type: 'image',
          image: { kind: 'media', mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', art: 'poster' },
          alt: 'Poster',
        },
        { type: 'button', label: 'Sync', action: { id: 'sync' } },
      ],
    };

    expect(clean(surface)).toEqual({ surface, problem: null });
  });

  it('drops pictures from hosts the plugin may not reach, and ones it did not pack', () => {
    const { surface } = clean({
      blocks: [
        {
          type: 'image',
          image: { kind: 'remote', url: 'https://tracker.example.net/pixel.png' },
          alt: 'x',
        },
        { type: 'image', image: { kind: 'asset', name: 'missing.png' }, alt: 'x' },
        {
          type: 'row',
          label: 'Row',
          image: { kind: 'remote', url: 'https://tracker.example.net/p.png' },
        },
        {
          type: 'list',
          rows: [
            { type: 'row', label: 'Kept', image: { kind: 'asset', name: 'icon.png' } },
            {
              type: 'row',
              label: 'Dropped',
              image: { kind: 'remote', url: 'https://tracker.example.net/q.png' },
            },
          ],
        },
        {
          type: 'section',
          title: 'Inside',
          children: [
            {
              type: 'image',
              image: { kind: 'remote', url: 'https://tracker.example.net/r.png' },
              alt: 'x',
            },
          ],
        },
      ],
    });

    expect(JSON.parse(JSON.stringify(surface))).toEqual({
      blocks: [
        { type: 'row', label: 'Row' },
        {
          type: 'list',
          rows: [
            { type: 'row', label: 'Kept', image: { kind: 'asset', name: 'icon.png' } },
            { type: 'row', label: 'Dropped' },
          ],
        },
        { type: 'section', title: 'Inside', children: [] },
      ],
    });
  });

  it('replaces a surface with a block Valence does not draw', () => {
    const answer = clean({ blocks: [{ type: 'html', html: '<script>alert(1)</script>' }] });

    expect(answer.surface.blocks[0]).toMatchObject({
      type: 'notice',
      title: 'This could not be shown',
    });
    expect(answer.problem).not.toBeNull();
  });

  it('replaces a link that is not https, and text carrying control characters', () => {
    expect(
      clean({ blocks: [{ type: 'link', label: 'Go', url: 'javascript:alert(1)' }] }).problem,
    ).not.toBeNull();
    expect(clean({ blocks: [{ type: 'text', text: 'hidden‮text' }] }).problem).not.toBeNull();
  });

  it('replaces an answer that is not JSON', () => {
    expect(cleanSurface('not json', manifest, assets).problem).toEqual(
      'The plugin answered with something that is not JSON.',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { SurfaceBlockSchema } from './SurfaceBlockSchema';

const EVERY_BLOCK = [
  { type: 'heading', text: 'Anime tracking' },
  { type: 'text', text: 'Connected as marques.', tone: 'muted' },
  { type: 'notice', tone: 'warning', title: 'Unmatched', text: '3 shows were not found.' },
  { type: 'row', label: 'Frieren', detail: '12 of 28', badge: 'Watching', icon: 'tv' },
  {
    type: 'button',
    label: 'Import now',
    action: { id: 'import' },
    tone: 'primary',
    icon: 'download',
  },
  { type: 'toggle', field: 'twoWay', label: 'Keep AniList up to date', value: true },
  { type: 'textField', field: 'username', label: 'Username', placeholder: 'name', isSecret: false },
  {
    type: 'select',
    field: 'list',
    label: 'List',
    value: 'watching',
    options: [{ value: 'watching', label: 'Watching' }],
  },
  { type: 'progress', label: 'Importing', value: 0.4 },
  { type: 'image', image: { kind: 'asset', name: 'logo.png' }, alt: 'AniList' },
  { type: 'link', label: 'Open AniList', url: 'https://anilist.co' },
  { type: 'media', mediaId: '6f1c1c0e-3a2b-4c5d-9e8f-0a1b2c3d4e5f' },
  { type: 'divider' },
  { type: 'section', title: 'Lists', children: [{ type: 'text', text: 'Nested' }] },
  { type: 'list', title: 'Recent', rows: [{ type: 'row', label: 'One' }] },
];

describe('SurfaceBlockSchema', () => {
  it.each(EVERY_BLOCK)('accepts a $type block', (block) => {
    expect(SurfaceBlockSchema.parse(block)).toEqual(block);
  });

  it('refuses a block type Valence does not draw', () => {
    expect(
      SurfaceBlockSchema.safeParse({ type: 'html', html: '<script>alert(1)</script>' }).success,
    ).toBe(false);
    expect(
      SurfaceBlockSchema.safeParse({ type: 'iframe', url: 'https://example.com' }).success,
    ).toBe(false);
  });

  it('refuses a link that is not https, and progress outside nought to one', () => {
    expect(
      SurfaceBlockSchema.safeParse({ type: 'link', label: 'Go', url: 'javascript:alert(1)' })
        .success,
    ).toBe(false);
    expect(SurfaceBlockSchema.safeParse({ type: 'progress', value: 1.5 }).success).toBe(false);
  });

  it('refuses a control character hidden in a label, even inside a section', () => {
    expect(
      SurfaceBlockSchema.safeParse({
        type: 'section',
        children: [{ type: 'heading', text: 'safe‮eman' }],
      }).success,
    ).toBe(false);
  });

  it('refuses a select with no options', () => {
    expect(
      SurfaceBlockSchema.safeParse({ type: 'select', field: 'x', label: 'X', options: [] }).success,
    ).toBe(false);
  });
});

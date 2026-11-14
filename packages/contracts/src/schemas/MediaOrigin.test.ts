import { describe, expect, it } from 'vitest';
import {
  FiledOriginsSchema,
  MediaOriginsRequestSchema,
  MediaOriginsSchema,
} from '@ValenceContracts/schemas/MediaOrigin';

describe('MediaOriginsSchema', () => {
  it('reads where each file came from and whether it is linked to a download', () => {
    const parsed = MediaOriginsSchema.parse({
      origins: {
        '/media/films/Heat.mkv': { source: 'download', via: 'qBittorrent', link: 'linked' },
        '/media/films/Alien.mkv': { source: 'disk', via: null, link: null },
        '/media/films/Up.mkv': { source: 'handOff', via: 'Radarr', link: 'alone' },
      },
    });

    expect(parsed.origins['/media/films/Heat.mkv']?.link).toBe('linked');
  });

  it('refuses a source it does not know', () => {
    expect(() =>
      MediaOriginsSchema.parse({
        origins: { '/a.mkv': { source: 'magic', via: null, link: null } },
      }),
    ).toThrow();
  });
});

describe('MediaOriginsRequestSchema', () => {
  it('asks of at least one path and no more than five hundred', () => {
    expect(MediaOriginsRequestSchema.safeParse({ paths: [] }).success).toBe(false);
    expect(
      MediaOriginsRequestSchema.safeParse({ paths: Array.from({ length: 501 }, () => '/a') })
        .success,
    ).toBe(false);
    expect(MediaOriginsRequestSchema.safeParse({ paths: ['/a.mkv'] }).success).toBe(true);
  });
});

describe('FiledOriginsSchema', () => {
  it('takes only what the requests service files: downloads and hand-offs', () => {
    expect(
      FiledOriginsSchema.safeParse({ filed: { '/a.mkv': { source: 'download', via: 'SAB' } } })
        .success,
    ).toBe(true);
    expect(
      FiledOriginsSchema.safeParse({ filed: { '/a.mkv': { source: 'upload', via: null } } })
        .success,
    ).toBe(false);
  });
});

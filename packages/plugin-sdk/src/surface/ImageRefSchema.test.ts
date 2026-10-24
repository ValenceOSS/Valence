import { describe, expect, it } from 'vitest';
import { ImageRefSchema } from './ImageRefSchema';

describe('ImageRefSchema', () => {
  it('accepts a packed picture, an https picture and a library picture', () => {
    expect(ImageRefSchema.safeParse({ kind: 'asset', name: 'cover.png' }).success).toBe(true);
    expect(
      ImageRefSchema.safeParse({ kind: 'remote', url: 'https://i.scdn.co/image/x' }).success,
    ).toBe(true);
    expect(
      ImageRefSchema.safeParse({
        kind: 'media',
        mediaId: '6f1c1c0e-3a2b-4c5d-9e8f-0a1b2c3d4e5f',
        art: 'poster',
      }).success,
    ).toBe(true);
  });

  it('takes a small or medium hint for how large a remote or library picture is drawn', () => {
    const remote = { kind: 'remote', url: 'https://example.com/a.jpg' };

    expect(ImageRefSchema.parse({ ...remote, size: 'small' })).toMatchObject({ size: 'small' });
    expect(ImageRefSchema.safeParse({ ...remote, size: 'huge' }).success).toBe(false);
  });

  it('refuses a path that walks out of the package, an http picture and svg', () => {
    expect(ImageRefSchema.safeParse({ kind: 'asset', name: '../secret.png' }).success).toBe(false);
    expect(ImageRefSchema.safeParse({ kind: 'remote', url: 'http://i.scdn.co/x' }).success).toBe(
      false,
    );
    expect(ImageRefSchema.safeParse({ kind: 'asset', name: 'logo.svg' }).success).toBe(false);
  });
});

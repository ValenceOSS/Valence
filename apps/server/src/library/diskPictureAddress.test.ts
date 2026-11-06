import { describe, expect, it } from 'vitest';
import { diskPictureAddress } from './diskPictureAddress';

describe('diskPictureAddress', () => {
  it('keeps a picture’s path in an address no catalogue would give', () => {
    const address = diskPictureAddress('/films/Heat (1995)/poster.jpg');

    expect(address.startsWith('valence-disk:')).toBe(true);
    expect(Buffer.from(address.slice('valence-disk:'.length), 'base64url').toString('utf8')).toBe(
      '/films/Heat (1995)/poster.jpg',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { jellyfinPictureAddress } from './jellyfinPictureAddress';

describe('jellyfinPictureAddress', () => {
  it('addresses a picture by its item, its kind and its tag, with a query a width can join', () => {
    expect(jellyfinPictureAddress('http://j.test', 'abc', 'Primary', 't 1')).toBe(
      'http://j.test/Items/abc/Images/Primary?tag=t%201&quality=90',
    );
  });
});

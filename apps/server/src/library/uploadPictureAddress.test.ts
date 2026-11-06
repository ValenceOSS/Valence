import { describe, expect, it } from 'vitest';
import { uploadPictureAddress } from './uploadPictureAddress';

describe('uploadPictureAddress', () => {
  it('names an upload by its id', () => {
    expect(uploadPictureAddress('abc')).toBe('valence-upload:abc');
  });
});

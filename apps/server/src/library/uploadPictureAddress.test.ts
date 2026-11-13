import { describe, expect, it } from 'vitest';
import { UPLOAD_ADDRESS } from './UPLOAD_ADDRESS';
import { uploadPictureAddress } from './uploadPictureAddress';

describe('uploadPictureAddress', () => {
  it('names an upload by its id', () => {
    expect(uploadPictureAddress('abc')).toBe('valence-upload:abc');
  });

  it('carries the shape a framed upload is cut to, and where it sits, in a form it is read back from', () => {
    const address = uploadPictureAddress('00000000-0000-4000-8000-000000000001', {
      kind: 'backdrop',
      frame: { zoom: 1.25, x: -0.000_000_1, y: 1 },
    });

    expect(address).toBe(
      'valence-upload:00000000-0000-4000-8000-000000000001#backdrop:1.2500:-0.0000:1.0000',
    );
    expect(UPLOAD_ADDRESS.test(address)).toBe(true);
  });
});

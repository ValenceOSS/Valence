import { describe, expect, it } from 'vitest';
import { CROPS } from '@ValenceServer/pictures/CROPS';
import { uploadAddressOf } from './uploadAddressOf';

const ID = '3f0b8c2e-1d4a-4b6f-9c8e-2a7d5e1f0b3c';

describe('uploadAddressOf', () => {
  it('reads an upload kept whole', () => {
    expect(uploadAddressOf(`valence-upload:${ID}`)).toEqual({ id: ID, cropping: null });
  });

  it('reads the shape and part of an upload that was framed', () => {
    expect(uploadAddressOf(`valence-upload:${ID}#poster:2:0.5:-0.25`)).toEqual({
      id: ID,
      cropping: { crop: CROPS.poster, frame: { zoom: 2, x: 0.5, y: -0.25 } },
    });
  });

  it('takes no address whose frame no picture can have', () => {
    expect(uploadAddressOf(`valence-upload:${ID}#poster:0:0:0`)).toBeNull();
    expect(uploadAddressOf(`valence-upload:${ID}#backdrop:1:3:0`)).toBeNull();
  });

  it('takes nothing that is not an upload address', () => {
    expect(uploadAddressOf('https://example.com/poster.jpg')).toBeNull();
  });
});

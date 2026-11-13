import { describe, expect, it } from 'vitest';
import { UPLOAD_ADDRESS } from './UPLOAD_ADDRESS';

const ID = '00000000-0000-4000-8000-000000000001';

describe('UPLOAD_ADDRESS', () => {
  it('matches an upload, framed or left alone', () => {
    expect(UPLOAD_ADDRESS.exec(`valence-upload:${ID}`)?.[1]).toBe(ID);
    expect(UPLOAD_ADDRESS.exec(`valence-upload:${ID}#poster:1.5:-0.25:1`)?.slice(1)).toEqual([
      ID,
      'poster',
      '1.5',
      '-0.25',
      '1',
    ]);
  });

  it('matches nothing else', () => {
    expect(UPLOAD_ADDRESS.test(`valence-upload:${ID}#logo:1:0:0`)).toBe(false);
    expect(UPLOAD_ADDRESS.test('valence-upload:../../etc/passwd')).toBe(false);
  });
});

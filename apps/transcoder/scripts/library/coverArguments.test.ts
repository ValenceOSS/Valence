import { describe, expect, it } from 'vitest';
import { coverArguments } from './coverArguments';

const sourceOf = (args: string[]): string => args[args.indexOf('-i') + 1] ?? '';

describe('coverArguments', () => {
  it('draws one frame of the colour it is given', () => {
    const args = coverArguments('3a5f8e', 'album', '/out/cover.jpg');

    expect(sourceOf(args)).toContain('c=0x3a5f8e');
    expect(args[args.indexOf('-frames:v') + 1]).toBe('1');
    expect(args.at(-1)).toBe('/out/cover.jpg');
  });

  it('makes an album square and a book taller than wide', () => {
    expect(sourceOf(coverArguments('000000', 'album', '/a.jpg'))).toContain('s=600x600');
    expect(sourceOf(coverArguments('000000', 'book', '/b.jpg'))).toContain('s=600x900');
  });
});

import { describe, expect, it } from 'vitest';
import { whatToConvertNext } from './whatToConvertNext';

const copying = { video: { kind: 'passthrough' }, audio: { kind: 'passthrough' } } as const;

const converting = { video: { kind: 'transcode' }, audio: { kind: 'passthrough' } } as const;

const convertingBoth = { video: { kind: 'transcode' }, audio: { kind: 'transcode' } } as const;

describe('whatToConvertNext', () => {
  it('converts the picture first when a copied stream will not decode', () => {
    expect(whatToConvertNext({ plan: copying, converted: undefined, fault: { category: 3 } })).toBe(
      'picture',
    );
  });

  it('converts the sound as well once the converted picture still will not decode', () => {
    expect(
      whatToConvertNext({ plan: converting, converted: 'picture', fault: { category: 3 } }),
    ).toBe('pictureAndSound');
  });

  it('goes straight to the sound where the picture was being converted already', () => {
    expect(
      whatToConvertNext({ plan: converting, converted: undefined, fault: { category: 3 } }),
    ).toBe('pictureAndSound');
  });

  it('gives up once everything is converted', () => {
    expect(
      whatToConvertNext({
        plan: convertingBoth,
        converted: 'pictureAndSound',
        fault: { category: 3 },
      }),
    ).toBeNull();
  });

  it('retries the element refusing a file it was handed directly', () => {
    expect(whatToConvertNext({ plan: copying, converted: undefined, fault: null })).toBe('picture');
  });

  it('leaves a network or loading failure alone', () => {
    for (const category of [1, 4, 5]) {
      expect(
        whatToConvertNext({ plan: copying, converted: undefined, fault: { category } }),
      ).toBeNull();
    }
  });

  it('leaves a full buffer alone, which converting would not empty', () => {
    expect(
      whatToConvertNext({
        plan: copying,
        converted: undefined,
        fault: { category: 3, code: 3017 },
      }),
    ).toBeNull();
  });
});

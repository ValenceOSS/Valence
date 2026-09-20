import { describe, expect, it } from 'vitest';
import { isUnderAny } from './isUnderAny';

describe('isUnderAny', () => {
  it('covers a file inside a folder that could not be read', () => {
    expect(isUnderAny('/media/Films/Arrival.mkv', ['/media/Films'])).toBe(true);
  });

  it('covers the path itself, for a file that could not be read', () => {
    expect(isUnderAny('/media/Films/Arrival.mkv', ['/media/Films/Arrival.mkv'])).toBe(true);
  });

  it('covers a file further down than the folder that failed', () => {
    expect(isUnderAny('/media/Films/4K/Dune/Dune.mkv', ['/media/Films/4K'])).toBe(true);
  });

  it('does not cover a folder that merely starts with the same letters', () => {
    expect(isUnderAny('/media/Films Archive/Arrival.mkv', ['/media/Films'])).toBe(false);
  });

  it('does not cover a file somewhere else entirely', () => {
    expect(isUnderAny('/media/Shows/Severance/S01E01.mkv', ['/media/Films'])).toBe(false);
  });

  it('covers nothing where everything could be read', () => {
    expect(isUnderAny('/media/Films/Arrival.mkv', [])).toBe(false);
  });

  it('takes several failures at once', () => {
    const failed = ['/media/Films', '/media/Shows/Severance'];

    expect(isUnderAny('/media/Shows/Severance/S01E01.mkv', failed)).toBe(true);
    expect(isUnderAny('/media/Shows/Andor/S01E01.mkv', failed)).toBe(false);
  });
});

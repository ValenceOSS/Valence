import { describe, expect, it } from 'vitest';
import { PAGE_WIDTHS, snapWidth } from './snapWidth';

describe('snapWidth', () => {
  it('rounds a window up to the next width kept', () => {
    expect(snapWidth(1171)).toBe(1280);
    expect(snapWidth(1500)).toBe(1920);
  });

  it('keeps a width that is already one of them', () => {
    expect(snapWidth(960)).toBe(960);
  });

  it('draws a narrow window at the narrowest kept', () => {
    expect(snapWidth(1)).toBe(640);
  });

  it('stops at the widest, however wide the screen', () => {
    expect(snapWidth(8000)).toBe(3840);
  });

  it('keeps few enough widths that a page has only a handful of copies', () => {
    expect(PAGE_WIDTHS.length).toBeLessThanOrEqual(6);
  });
});

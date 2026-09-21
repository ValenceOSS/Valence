import { afterEach, describe, expect, it, vi } from 'vitest';
import { WIDEST, widthFor } from './widthFor';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('widthFor', () => {
  it('asks for the width the pages will be drawn at, in real pixels', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('devicePixelRatio', 2);

    expect(widthFor(1)).toBe(2000);
    expect(widthFor(2)).toBe(1000);
  });

  it('never asks for more than the widest a page is worth', () => {
    vi.stubGlobal('innerWidth', 5000);
    vi.stubGlobal('devicePixelRatio', 3);

    expect(widthFor(1)).toBe(WIDEST);
  });

  it('counts a screen density of more than three as three', () => {
    vi.stubGlobal('innerWidth', 1000);
    vi.stubGlobal('devicePixelRatio', 5);

    expect(widthFor(1)).toBe(3000);
  });
});

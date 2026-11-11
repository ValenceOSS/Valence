import { describe, expect, it } from 'vitest';
import { liquidOutline } from './liquidOutline';

const heightAt = (outline: string, x: number): number => {
  const points = [...outline.matchAll(/L ([\d.]+) ([\d.]+)/gu)].map((found) => ({
    x: Number(found[1]),
    y: Number(found[2]),
  }));
  const ys = points.filter((point) => Math.abs(point.x - x) < 1.01).map((point) => point.y);

  return Math.max(...ys) - Math.min(...ys);
};

describe('liquidOutline', () => {
  it('traces a closed path for a CSS clip', () => {
    const outline = liquidOutline(100, 14, 6, 3, 50);

    expect(outline.startsWith("path('M ")).toBe(true);
    expect(outline.endsWith(" Z')")).toBe(true);
  });

  it('bulges where the pointer rests and stays the band thickness far from it', () => {
    const outline = liquidOutline(200, 14, 6, 3, 100);

    expect(heightAt(outline, 100)).toBeCloseTo(12, 0);
    expect(heightAt(outline, 10)).toBeCloseTo(6, 0);
  });

  it('is a plain band where there is no bulge', () => {
    const outline = liquidOutline(200, 14, 6, 0, 100);

    expect(heightAt(outline, 100)).toBeCloseTo(6, 1);
  });
});

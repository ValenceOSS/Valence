import { describe, expect, it } from 'vitest';
import { tapZoneOf } from './tapZoneOf';

describe('tapZoneOf', () => {
  it('goes back from the left edge', () => {
    expect(tapZoneOf(0.1, 0.33)).toBe('back');
  });

  it('goes forward from the right edge', () => {
    expect(tapZoneOf(0.9, 0.33)).toBe('forward');
  });

  it('plays and pauses from the middle', () => {
    expect(tapZoneOf(0.5, 0.33)).toBe('middle');
  });

  it('counts the very edge of each side as that side', () => {
    expect(tapZoneOf(0.33, 0.33)).toBe('back');
    expect(tapZoneOf(0.67, 0.33)).toBe('forward');
  });
});

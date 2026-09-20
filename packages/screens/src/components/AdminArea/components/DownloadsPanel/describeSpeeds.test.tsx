import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { describeSpeeds } from './describeSpeeds';

const said = (down: number | null, up: number | null): string =>
  render(<>{describeSpeeds(down, up)}</>).container.textContent ?? '';

describe('describeSpeeds', () => {
  it('says both directions, or the one that is known', () => {
    expect(said(1_258_291, 40_960)).toBe('↓ 1.2 MB/s · ↑ 40 KB/s');
    expect(said(2048, null)).toBe('↓ 2.0 KB/s');
    expect(said(null, 0)).toBe('↑ 0 B/s');
  });

  it('says nothing where neither is known', () => {
    expect(describeSpeeds(null, null)).toBeNull();
  });
});

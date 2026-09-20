import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { speedsOf } from './speedsOf';

const said = (down: number | null, up: number | null): string[] =>
  speedsOf(down, up).map((line) => render(<>{line}</>).container.textContent ?? '');

describe('speedsOf', () => {
  it('says each direction that is known', () => {
    expect(said(1_258_291, 40_960)).toEqual(['↓ 1.2 MB/s', '↑ 40 KB/s']);
    expect(said(2048, null)).toEqual(['↓ 2.0 KB/s']);
    expect(said(null, null)).toEqual([]);
  });
});

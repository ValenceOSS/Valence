import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFileAddress } from './useFileAddress';

const createObjectURL = vi.fn().mockReturnValue('blob:chosen');
const revokeObjectURL = vi.fn();

Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
});

describe('useFileAddress', () => {
  it('gives a chosen file an address, and lets go of it once the file is gone', () => {
    const file = new File(['bytes'], 'face.png', { type: 'image/png' });
    const { result, rerender } = renderHook<string | null, { chosen: File | null }>(
      ({ chosen }) => useFileAddress(chosen),
      { initialProps: { chosen: file } },
    );

    expect(result.current).toBe('blob:chosen');

    rerender({ chosen: null });

    expect(result.current).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:chosen');
  });
});

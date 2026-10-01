import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNowReading } from './useNowReading';

const reported = vi.hoisted(() => ({ reportNowReading: vi.fn(() => Promise.resolve(true)) }));

vi.mock('@ValenceClient/books/bookDevices', () => reported);

beforeEach(() => {
  reported.reportNowReading.mockClear();
});

describe('useNowReading', () => {
  it('says the book is open, where somebody is in it, and that it has closed', () => {
    const { result, unmount } = renderHook(() => useNowReading('book-1'));

    result.current({ fraction: 0.5, pageNumber: null });
    unmount();

    expect(reported.reportNowReading.mock.calls).toEqual([
      [expect.objectContaining({ bookId: 'book-1', fraction: null, pageNumber: null })],
      [expect.objectContaining({ bookId: 'book-1', fraction: 0.5, pageNumber: null })],
      [null],
    ]);
  });

  it('says nothing while no book is open', () => {
    const { result } = renderHook(() => useNowReading(null));

    result.current({ fraction: 0.5, pageNumber: null });

    expect(reported.reportNowReading).not.toHaveBeenCalled();
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DRAWINGS } from './DRAWINGS';
import { useDrawing } from './useDrawing';

const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1"/></svg>';

const answering = (ok: boolean) =>
  vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response(ok ? SVG : 'gone', { status: ok ? 200 : 404, statusText: ok ? 'OK' : 'Gone' }),
    );

afterEach(() => {
  vi.restoreAllMocks();
  DRAWINGS.clear();
});

describe('useDrawing', () => {
  it('reads the drawing, says so, and keeps it for next time', async () => {
    answering(true);
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      useDrawing('http://one.local/face.svg', { onLoad, onMissing: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current).toBe(SVG);
    });
    expect(onLoad).toHaveBeenCalled();
    expect(DRAWINGS.get('http://one.local/face.svg')).toBe(SVG);
  });

  it('hands back a kept drawing at once without asking for it again', () => {
    DRAWINGS.set('http://one.local/kept.svg', SVG);
    const asked = answering(true);
    const onLoad = vi.fn();
    const { result } = renderHook(() =>
      useDrawing('http://one.local/kept.svg', { onLoad, onMissing: vi.fn() }),
    );

    expect(result.current).toBe(SVG);
    expect(onLoad).toHaveBeenCalled();
    expect(asked).not.toHaveBeenCalled();
  });

  it('says so where the drawing cannot be had', async () => {
    answering(false);
    const onMissing = vi.fn();
    const { result } = renderHook(() => useDrawing('http://one.local/gone.svg', { onMissing }));

    await waitFor(() => {
      expect(onMissing).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });
});

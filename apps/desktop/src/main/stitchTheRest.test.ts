import { describe, expect, it, vi } from 'vitest';
import { stitchTheRest } from './stitchTheRest';

const FILE = 'abcdefghij';

/**
 * The server's answer for the bytes of the file from one to another.
 *
 * @param from - The first byte.
 * @param to - The last byte.
 * @returns The answer.
 */
const aSlice = (from: number, to: number): Response =>
  new Response(FILE.slice(from, to + 1), {
    status: 206,
    headers: {
      'content-range': `bytes ${from.toString()}-${to.toString()}/${FILE.length.toString()}`,
      'content-length': (to - from + 1).toString(),
      'content-type': 'video/x-matroska',
    },
  });

describe('stitchTheRest', () => {
  it('says the answer is the whole rest of the file, with its real length', () => {
    const stitched = stitchTheRest(aSlice(2, 4), vi.fn(), vi.fn());

    expect(stitched?.status).toBe(206);
    expect(stitched?.headers.get('content-range')).toBe('bytes 2-9/10');
    expect(stitched?.headers.get('content-length')).toBe('8');
    expect(stitched?.headers.get('content-type')).toBe('video/x-matroska');
  });

  it('asks for each next slice as it is read, and hands on every byte', async () => {
    const askFrom = vi.fn((start: number) =>
      Promise.resolve(aSlice(start, Math.min(start + 2, 9))),
    );
    const stitched = stitchTheRest(aSlice(2, 4), askFrom, vi.fn());

    await expect(stitched?.text()).resolves.toBe('cdefghij');
    expect(askFrom.mock.calls).toEqual([[5], [8]]);
  });

  it('asks the server for nothing more until the page reads on', async () => {
    const askFrom = vi.fn((start: number) =>
      Promise.resolve(aSlice(start, Math.min(start + 2, 9))),
    );
    const stitched = stitchTheRest(aSlice(0, 2), askFrom, vi.fn());
    const reader = stitched?.body?.getReader();

    await reader?.read();
    await Promise.resolve();

    expect(askFrom).not.toHaveBeenCalled();

    await reader?.read();

    expect(askFrom).toHaveBeenCalledOnce();
  });

  it('lets the server go when the page stops reading', async () => {
    const letGo = vi.fn();
    const stitched = stitchTheRest(aSlice(0, 2), vi.fn(), letGo);

    await stitched?.body?.cancel();

    expect(letGo).toHaveBeenCalledOnce();
  });

  it('fails the rest where the server sends the wrong part', async () => {
    const stitched = stitchTheRest(aSlice(0, 2), () => Promise.resolve(aSlice(5, 7)), vi.fn());

    await expect(stitched?.text()).rejects.toThrow();
  });

  it('fails the rest where a slice claims a different file', async () => {
    const other = new Response('def', {
      status: 206,
      headers: { 'content-range': 'bytes 3-5/99' },
    });
    const stitched = stitchTheRest(aSlice(0, 2), () => Promise.resolve(other), vi.fn());

    await expect(stitched?.text()).rejects.toThrow();
  });

  it('fails the rest where a slice is shorter than the range it claims', async () => {
    const short = new Response('d', {
      status: 206,
      headers: { 'content-range': 'bytes 3-5/10' },
    });
    const stitched = stitchTheRest(aSlice(0, 2), () => Promise.resolve(short), vi.fn());

    await expect(stitched?.text()).rejects.toThrow('less of the file');
  });

  it('passes on a slice that already reaches the end, and anything that is not a slice', () => {
    expect(stitchTheRest(aSlice(5, 9), vi.fn(), vi.fn())).toBeNull();
    expect(stitchTheRest(new Response('whole'), vi.fn(), vi.fn())).toBeNull();
  });
});

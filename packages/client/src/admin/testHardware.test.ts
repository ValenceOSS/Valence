import { afterEach, describe, expect, it, vi } from 'vitest';
import { testHardware } from './testHardware';

const REPORT = {
  accel: 'nvenc',
  encoder: 'h264_nvenc',
  decodesOnDevice: true,
  encodesOnDevice: true,
  speed: 14.2,
  softwareSpeed: 3.1,
  reason: null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('testHardware', () => {
  it('asks the server to try the backend named, and reads what the hardware did', async () => {
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify(REPORT))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(testHardware('nvenc')).resolves.toEqual(REPORT);
    expect(fetch.mock.calls[0]?.[1].body).toBe(JSON.stringify({ accel: 'nvenc' }));
  });

  it('answers nothing where the test could not be run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 503 }))),
    );

    await expect(testHardware('')).resolves.toBeNull();
  });
});

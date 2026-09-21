import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { describeDownloadProgress } from './describeDownloadProgress';

const GOING = {
  downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  state: 'downloading' as const,
  progress: 0.5,
  sizeBytes: 4 * 1024 ** 3,
  doneBytes: 2 * 1024 ** 3,
  downloadBytesPerSecond: 3 * 1024 ** 2,
  secondsLeft: 720,
};

const said = (progress: Parameters<typeof describeDownloadProgress>[0]): string =>
  render(<>{describeDownloadProgress(progress)}</>).container.textContent ?? '';

describe('describeDownloadProgress', () => {
  it('says how much has arrived, how fast, and how long is left', () => {
    expect(said(GOING)).toBe('2.0 GB of 4.0 GB · 3.0 MB/s · 12 min left');
  });

  it('says nothing where nothing is known', () => {
    expect(
      describeDownloadProgress({
        ...GOING,
        sizeBytes: null,
        secondsLeft: null,
        downloadBytesPerSecond: null,
      }),
    ).toBeNull();
  });

  it('says only what it knows', () => {
    expect(
      said({
        ...GOING,
        doneBytes: null,
        downloadBytesPerSecond: 0,
        secondsLeft: null,
      }),
    ).toBe('4.0 GB');
    expect(
      said({
        ...GOING,
        sizeBytes: null,
        secondsLeft: null,
        downloadBytesPerSecond: null,
      }),
    ).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { describeDownloadHold } from './describeDownloadHold';

describe('describeDownloadHold', () => {
  it('says what keeps a download from coming', () => {
    expect(describeDownloadHold('paused')).toBe('Paused');
    expect(describeDownloadHold('stalled')).toBe('Stalled');
    expect(describeDownloadHold('failed')).toBe('Failed');
  });

  it('says nothing while it is coming', () => {
    expect(describeDownloadHold('downloading')).toBeNull();
    expect(describeDownloadHold('queued')).toBeNull();
  });
});

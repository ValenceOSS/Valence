import { describe, expect, it } from 'vitest';
import { whereItHasGot } from '@ValenceClient/video/whereItHasGot';
import type { VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const watching = (overrides: Partial<VideoNowWatching> = {}): VideoNowWatching => ({
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 10_000,
  ...overrides,
});

describe('whereItHasGot', () => {
  it('moves a playing film on by the time since it was reported', () => {
    expect(whereItHasGot(watching(), 15_000)).toBe(65);
  });

  it('leaves a paused film where it was reported', () => {
    expect(whereItHasGot(watching({ isPlaying: false }), 15_000)).toBe(60);
  });

  it('never goes past the end', () => {
    expect(whereItHasGot(watching({ durationSeconds: 62 }), 15_000)).toBe(62);
  });

  it('never goes back where the clock here is behind the report', () => {
    expect(whereItHasGot(watching(), 5_000)).toBe(60);
  });

  it('keeps moving where the length of the film is not known', () => {
    expect(whereItHasGot(watching({ durationSeconds: 0 }), 15_000)).toBe(65);
  });
});

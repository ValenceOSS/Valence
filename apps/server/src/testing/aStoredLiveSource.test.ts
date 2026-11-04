import { describe, expect, it } from 'vitest';
import { aStoredLiveSource } from '@ValenceServer/testing/aStoredLiveSource';

describe('aStoredLiveSource', () => {
  it('is a single stream, with what a test changes', () => {
    expect(aStoredLiveSource()).toMatchObject({ kind: 'stream', channelCount: 1, problem: null });
    expect(aStoredLiveSource({ name: 'Sport' }).name).toBe('Sport');
  });
});

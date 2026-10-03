import { describe, expect, it } from 'vitest';
import { valenceOwnBytes } from './valenceOwnBytes';

const CACHE = {
  previews: { count: 1, bytes: 100 },
  trickplay: { count: 1, bytes: 20 },
  sessions: { count: 1, bytes: 3 },
  atMs: 0,
};

describe('valenceOwnBytes', () => {
  it('adds up everything Valence keeps of its own: caches, artwork and book pages', () => {
    expect(
      valenceOwnBytes(
        CACHE,
        { count: 2, bytes: 4000, atMs: 0 },
        { count: 1, bytes: 50000, atMs: 0 },
      ),
    ).toBe(54_123);
  });

  it('counts nothing for what has not been counted yet', () => {
    expect(valenceOwnBytes(null, null, null)).toBe(0);
  });
});

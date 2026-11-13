import { describe, expect, it } from 'vitest';
import { innerAddressOf } from './innerAddressOf';

const ORIGIN = 'https://valence.example';

describe('innerAddressOf', () => {
  it('passes a request through to exactly the route that was allowed', () => {
    expect(innerAddressOf('/api/media/abc/subtitles/0123', '?start=5', ORIGIN)?.toString()).toBe(
      `${ORIGIN}/api/media/abc/subtitles/0123?start=5`,
    );
  });

  it('passes nothing through where building the address would change the route', () => {
    expect(innerAddressOf('/api/media/abc/subtitles/..\\..\\..\\libraries', '', ORIGIN)).toBeNull();
    expect(innerAddressOf('/api/media/abc/subtitles/../../libraries', '', ORIGIN)).toBeNull();
    expect(innerAddressOf('/api/media/abc/subtitles/a b', '', ORIGIN)).toBeNull();
  });
});

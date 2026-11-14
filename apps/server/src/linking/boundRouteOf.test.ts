import { describe, expect, it } from 'vitest';
import { boundRouteOf } from './boundRouteOf';

describe('boundRouteOf', () => {
  it('keeps the path and leaves what follows a question mark', () => {
    expect(boundRouteOf('/catalogue/films?after=abc')).toBe('/catalogue/films');
  });

  it('reads an escaped path the same as one written plainly', () => {
    expect(boundRouteOf('/pair/a%20b')).toBe(boundRouteOf('/pair/a b'));
  });

  it('keeps a path that cannot be unescaped as it was written', () => {
    expect(boundRouteOf('/api/media/%E0%A4%A')).toBe('/api/media/%E0%A4%A');
  });
});

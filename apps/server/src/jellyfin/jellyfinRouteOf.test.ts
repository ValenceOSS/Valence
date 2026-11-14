import { describe, expect, it } from 'vitest';
import { jellyfinRouteOf } from './jellyfinRouteOf';

describe('jellyfinRouteOf', () => {
  it('drops the base and lowers the case', () => {
    expect(jellyfinRouteOf('/jellyfin/Users/AuthenticateByName')).toBe('/users/authenticatebyname');
  });

  it('keeps the case of a stream’s ticket and files', () => {
    expect(jellyfinRouteOf('/jellyfin/Videos/AB/hls/TiCkEt/index.m3u8')).toBe(
      '/videos/ab/hls/TiCkEt/index.m3u8',
    );
  });

  it('reads the base alone as the root', () => {
    expect(jellyfinRouteOf('/jellyfin')).toBe('/');
  });
});

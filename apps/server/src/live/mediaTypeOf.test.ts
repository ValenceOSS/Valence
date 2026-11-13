import { describe, expect, it } from 'vitest';
import { mediaTypeOf } from './mediaTypeOf';

describe('mediaTypeOf', () => {
  it('keeps a media type, without its parameters', () => {
    expect(mediaTypeOf('video/mp2t', 'video/mp4')).toBe('video/mp2t');
    expect(mediaTypeOf('audio/aac; charset=x', 'video/mp4')).toBe('audio/aac');
    expect(mediaTypeOf('application/octet-stream', 'video/mp4')).toBe('application/octet-stream');
  });

  it('replaces a type that would render as a page', () => {
    expect(mediaTypeOf('text/html; charset=utf-8', 'video/mp2t')).toBe('video/mp2t');
    expect(mediaTypeOf('image/svg+xml', 'video/mp2t')).toBe('video/mp2t');
    expect(mediaTypeOf('application/xhtml+xml', 'video/mp2t')).toBe('video/mp2t');
  });

  it('uses the fallback where nothing was said', () => {
    expect(mediaTypeOf(null, 'video/mp2t')).toBe('video/mp2t');
    expect(mediaTypeOf('', 'video/mp2t')).toBe('video/mp2t');
  });
});

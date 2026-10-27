import { describe, expect, it } from 'vitest';
import { readStreamedPath } from './readStreamedPath';
import { streamedPathOf } from './streamedPathOf';

describe('the path a streamed film is kept under', () => {
  it('names the film, and reads back as it', () => {
    expect(streamedPathOf(603)).toBe('streamed://film/603');
    expect(readStreamedPath(streamedPathOf(603))).toBe(603);
  });

  it.each([
    '/media/Films/film.mkv',
    'streamed://film/',
    'streamed://film/abc',
    'streamed://film/0',
  ])('reads %s as no streamed film', (path) => {
    expect(readStreamedPath(path)).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { VideoChapterListSchema, VideoChapterSchema } from './VideoChapter';

describe('VideoChapterSchema', () => {
  it('reads a chapter with a name, and one without', () => {
    expect(VideoChapterSchema.parse({ title: 'Opening', startSeconds: 0, endSeconds: 90 })).toEqual(
      { title: 'Opening', startSeconds: 0, endSeconds: 90 },
    );
    expect(VideoChapterSchema.parse({ title: null, startSeconds: 90, endSeconds: 600 }).title).toBe(
      null,
    );
  });

  it('refuses a chapter that starts before the film does', () => {
    expect(
      VideoChapterSchema.safeParse({ title: null, startSeconds: -1, endSeconds: 5 }).success,
    ).toBe(false);
  });
});

describe('VideoChapterListSchema', () => {
  it('reads a list of them', () => {
    expect(
      VideoChapterListSchema.parse([{ title: null, startSeconds: 0, endSeconds: 5 }]),
    ).toHaveLength(1);
  });
});

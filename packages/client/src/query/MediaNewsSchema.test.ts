import { describe, expect, it } from 'vitest';
import { MediaNewsSchema } from '@ValenceClient/query/MediaNewsSchema';

describe('MediaNewsSchema', () => {
  it('reads every kind of media news the server names titles in', () => {
    const said = [
      { event: 'artwork', mediaIds: ['one'] },
      { event: 'metadata', mediaIds: ['one', 'two'] },
      { event: 'changed', mediaIds: ['one'] },
      { event: 'changed', mediaId: 'one' },
      { event: 'collections' },
      { event: 'likeness' },
    ];

    for (const news of said) {
      expect(MediaNewsSchema.safeParse(news).success).toBe(true);
    }
  });

  it('reads nothing from news that names no title', () => {
    expect(MediaNewsSchema.safeParse({ added: 4 }).success).toBe(false);
    expect(MediaNewsSchema.safeParse({ event: 'artwork', mediaIds: [] }).success).toBe(false);
    expect(MediaNewsSchema.safeParse(null).success).toBe(false);
  });
});

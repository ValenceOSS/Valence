import { describe, expect, it } from 'vitest';
import { StreamsAnswerSchema } from './StreamsAnswerSchema';

describe('StreamsAnswerSchema', () => {
  it('fills in what a source did not say about a stream', () => {
    expect(
      StreamsAnswerSchema.parse({
        streams: [{ key: 'a', name: 'Film.2001.1080p', isReady: true }],
      }),
    ).toEqual({
      streams: [
        {
          key: 'a',
          name: 'Film.2001.1080p',
          infoHash: null,
          isReady: true,
          sizeBytes: null,
          fileName: null,
        },
      ],
    });
  });

  it('refuses two streams under one key', () => {
    expect(
      StreamsAnswerSchema.safeParse({
        streams: [
          { key: 'a', name: 'One', isReady: true },
          { key: 'a', name: 'Two', isReady: false },
        ],
      }).success,
    ).toBe(false);
  });
});

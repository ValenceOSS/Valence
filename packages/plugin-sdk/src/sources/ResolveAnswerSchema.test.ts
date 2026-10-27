import { describe, expect, it } from 'vitest';
import { ResolveAnswerSchema } from './ResolveAnswerSchema';

describe('ResolveAnswerSchema', () => {
  it('reads a link that is ready, with no expiry where none was given', () => {
    expect(
      ResolveAnswerSchema.parse({
        kind: 'ready',
        url: 'https://eu1.files.example.com/f/abc',
        fileName: 'film.mkv',
        sizeBytes: 1024,
      }),
    ).toEqual({
      kind: 'ready',
      url: 'https://eu1.files.example.com/f/abc',
      fileName: 'film.mkv',
      sizeBytes: 1024,
      expiresAt: null,
    });
  });

  it('reads a stream still being prepared, and a refusal', () => {
    expect(ResolveAnswerSchema.parse({ kind: 'preparing', progress: 0.5 })).toEqual({
      kind: 'preparing',
      progress: 0.5,
    });
    expect(ResolveAnswerSchema.parse({ kind: 'refused', reason: 'archive' })).toEqual({
      kind: 'refused',
      reason: 'archive',
      message: null,
    });
  });

  it('refuses a link that is not https', () => {
    expect(
      ResolveAnswerSchema.safeParse({
        kind: 'ready',
        url: 'http://files.example.com/f/abc',
        fileName: 'film.mkv',
        sizeBytes: 1024,
      }).success,
    ).toBe(false);
  });
});

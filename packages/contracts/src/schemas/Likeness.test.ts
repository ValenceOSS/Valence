import { describe, expect, it } from 'vitest';
import { BecauseYouWatchedSchema, LikeThisSchema } from './Likeness';

const MATRIX = {
  id: '6f1c2a1e-6c7b-4f0e-9a51-0d5f8e3a9b10',
  libraryId: '1d9b0d1c-3a54-4f3a-8f77-3a8d5b0f2c11',
  title: 'The Matrix',
  year: 1999,
  durationSeconds: 8160,
  width: 1920,
  height: 800,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-10-01T00:00:00.000Z',
};

describe('LikeThisSchema', () => {
  it('reads the titles like one, filling in what a summary leaves out', () => {
    expect(LikeThisSchema.parse({ items: [MATRIX] }).items[0]).toMatchObject({
      title: 'The Matrix',
      seriesId: null,
      hasPoster: false,
    });
  });
});

describe('BecauseYouWatchedSchema', () => {
  it('reads each row with the title watched and what is like it', () => {
    const rows = BecauseYouWatchedSchema.parse({
      rows: [
        {
          watched: { title: 'Severance', mediaId: MATRIX.id, seriesId: 'severance' },
          items: [MATRIX],
        },
      ],
    }).rows;

    expect(rows[0]?.watched.title).toBe('Severance');
    expect(rows[0]?.items).toHaveLength(1);
  });

  it('refuses a row whose watched title has no name', () => {
    expect(
      BecauseYouWatchedSchema.safeParse({
        rows: [{ watched: { title: '', mediaId: MATRIX.id, seriesId: null }, items: [] }],
      }).success,
    ).toBe(false);
  });
});

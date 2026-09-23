import { describe, expect, it } from 'vitest';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { newShareFor } from './newShareFor';

const NOW = Date.parse('2026-09-23T12:00:00.000Z');

const EPISODE = MediaSummarySchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  title: 'Good News About Hell',
  year: 2022,
  durationSeconds: 3300,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  seriesId: 'severance',
});

const FOR_A_WEEK = { lasts: '7', cap: 'any', isWholeProgramme: false };

describe('newShareFor', () => {
  it('shares an episode as itself, for as long as was chosen', () => {
    expect(newShareFor({ kind: 'item', media: EPISODE }, FOR_A_WEEK, NOW)).toEqual({
      kind: 'item',
      mediaId: EPISODE.id,
      expiresAt: '2026-09-30T12:00:00.000Z',
      viewCap: null,
    });
  });

  it('shares the whole programme where somebody chose that from an episode', () => {
    expect(
      newShareFor({ kind: 'item', media: EPISODE }, { ...FOR_A_WEEK, isWholeProgramme: true }, NOW),
    ).toMatchObject({ kind: 'series', seriesId: 'severance' });
  });

  it('keeps a link until it is withdrawn, and caps how many may open it', () => {
    expect(
      newShareFor(
        { kind: 'series', seriesId: 'severance', title: 'Severance' },
        { lasts: 'forever', cap: '2', isWholeProgramme: false },
        NOW,
      ),
    ).toEqual({ kind: 'series', seriesId: 'severance', expiresAt: null, viewCap: 2 });
  });
});

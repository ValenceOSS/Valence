import { describe, expect, it } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { titleOfRow } from './titleOfRow';

describe('titleOfRow', () => {
  it('draws a listed programme as a title whose episodes are read once it is opened', () => {
    const lead = aMediaSummary({ id: 'e1', seriesId: 'show', seriesTitle: 'Show' });
    const title = titleOfRow({
      id: 'series lib show',
      key: 'show:lib show',
      kind: 'show',
      libraryId: lead.libraryId,
      lead,
      name: 'Show',
      order: 'show',
      year: 2020,
      files: 10,
      versions: 0,
      seasons: 2,
      episodes: 10,
      sizeBytes: 100,
      durationSeconds: 600,
      latestAddedAt: '2026-01-01T00:00:00.000Z',
      isMatched: true,
      posterFrom: 'e1',
      folder: '/shows/Show',
      leadPath: null,
      looks: {
        step: null,
        isStepMixed: false,
        range: null,
        isRangeMixed: false,
        codec: null,
        isCodecMixed: false,
        audio: null,
        isAudioMixed: false,
      },
      problemFiles: { duplicate: [], unreadable: [] },
      isEdited: false,
    });

    expect(title).toMatchObject({
      id: 'series lib show',
      kind: 'series',
      seasons: 2,
      episodes: [],
      parts: [],
      sizeBytes: 100,
    });
    expect(title.row?.episodes).toBe(10);
  });
});

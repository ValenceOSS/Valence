import { describe, expect, it } from 'vitest';
import { MediaRequestDraftSchema } from '@ValenceContracts/schemas/MediaRequest';
import { recordFromDraft } from './recordFromDraft';

const DRAFT = {
  kind: 'series' as const,
  tmdbId: 95396,
  libraryId: 'series',
  libraryPath: '/media/Series',
  seasons: [1],
  requestedBy: { id: 'someone', name: 'Someone' },
  isApproved: true,
  catalogue: { title: 'Severance', year: 2022 },
};

describe('recordFromDraft', () => {
  it('keeps what was asked, approved where the asker may be', () => {
    expect(
      recordFromDraft(MediaRequestDraftSchema.parse(DRAFT), 'id', '2026-09-19T00:00:00.000Z'),
    ).toMatchObject({
      id: 'id',
      title: 'Severance',
      approval: 'approved',
      seasons: [1],
      requestedByName: 'Someone',
      createdAt: '2026-09-19T00:00:00.000Z',
    });
  });

  it('waits on approval, and names no seasons for a film', () => {
    expect(
      recordFromDraft(
        MediaRequestDraftSchema.parse({ ...DRAFT, kind: 'film', isApproved: false }),
        'id',
        '2026-09-19T00:00:00.000Z',
      ),
    ).toMatchObject({ approval: 'awaiting', seasons: null });
  });
});

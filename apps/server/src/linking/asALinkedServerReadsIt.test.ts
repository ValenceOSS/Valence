import { describe, expect, it } from 'vitest';
import { asALinkedServerReadsIt } from './asALinkedServerReadsIt';
import type { FederationActivity } from '@ValenceContracts/schemas/LinkSharing';

const ENTRY: FederationActivity = {
  id: '00000000-0000-4000-8000-000000000001',
  at: '2026-11-16T12:00:00.000Z',
  personId: null,
  personName: null,
  action: 'subtitles',
  mediaTitle: 'A film',
  outcome: 'allowed',
  count: 1,
};

describe('asALinkedServerReadsIt', () => {
  it('says a subtitle search as looking a title up', () => {
    expect(asALinkedServerReadsIt(ENTRY).action).toBe('media');
  });

  it('leaves everything else as it was', () => {
    const watched = { ...ENTRY, action: 'parties' as const };

    expect(asALinkedServerReadsIt(watched)).toBe(watched);
  });
});

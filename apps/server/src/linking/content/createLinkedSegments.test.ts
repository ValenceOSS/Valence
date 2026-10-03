import { describe, expect, it, vi } from 'vitest';
import { aLinkedAskerAnswering } from '@ValenceServer/testing/aLinkedAskerAnswering';
import { createLinkedSegments } from './createLinkedSegments';
import type { SegmentService } from '@ValenceServer/segments/SegmentService';

const INTRO = {
  kind: 'intro' as const,
  startSeconds: 0,
  endSeconds: 30,
  source: 'fingerprint' as const,
};

const aLocal = () => ({
  list: vi.fn<SegmentService['list']>(() => Promise.resolve([])),
  replace: vi.fn<SegmentService['replace']>(() => Promise.resolve()),
});

const linkedTitleOf = (mediaId: string) =>
  Promise.resolve(mediaId === 'theirs' ? { serverId: 'films', remoteId: 'r1' } : null);

describe('createLinkedSegments', () => {
  it('reads a linked title’s intros and credits from the server that found them', async () => {
    const asker = aLinkedAskerAnswering(() => Response.json({ segments: [INTRO] }));

    expect(await createLinkedSegments(aLocal(), linkedTitleOf, asker).list('theirs')).toEqual([
      INTRO,
    ]);
    expect(asker.asked[0]?.route).toBe('/api/media/r1/segments');
  });

  it('reads none where that server cannot be reached', async () => {
    expect(
      await createLinkedSegments(
        aLocal(),
        linkedTitleOf,
        aLinkedAskerAnswering(() => null),
      ).list('theirs'),
    ).toEqual([]);
  });

  it('writes only this server’s own titles’ segments', async () => {
    const local = aLocal();
    const segments = createLinkedSegments(
      local,
      linkedTitleOf,
      aLinkedAskerAnswering(() => null),
    );

    await segments.replace('theirs', [INTRO]);
    await segments.replace('mine', [INTRO]);

    expect(local.replace).toHaveBeenCalledExactlyOnceWith('mine', [INTRO]);
    expect(await segments.list('mine')).toEqual([]);
  });
});

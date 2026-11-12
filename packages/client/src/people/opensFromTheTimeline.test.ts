import { describe, expect, it } from 'vitest';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { opensFromTheTimeline } from './opensFromTheTimeline';

const A_CREDIT = { ...aCatalogueTitle({ kind: 'series' }), role: null, episodeCount: null };

describe('opensFromTheTimeline', () => {
  it('opens a credit of a kind the server takes requests for', () => {
    expect(opensFromTheTimeline(A_CREDIT, new Set(['series']))).toBe(true);
  });

  it('leaves shut a credit of a kind the server takes no requests for', () => {
    expect(opensFromTheTimeline(A_CREDIT, new Set(['film']))).toBe(false);
  });

  it('opens a credit already on the server whatever it takes requests for', () => {
    const here = (status: 'library' | 'linked') => ({
      ...A_CREDIT,
      standing: { status, mediaId: 'm-1', requestId: null, requestState: null },
    });

    expect(opensFromTheTimeline(here('library'), new Set())).toBe(true);
    expect(opensFromTheTimeline(here('linked'), new Set())).toBe(true);
  });
});

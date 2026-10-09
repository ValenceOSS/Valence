import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { withLibraryGone } from './withLibraryGone';

describe('withLibraryGone', () => {
  it('marks an open request whose library is gone failed, saying so', () => {
    const [gone] = withLibraryGone(
      [aShownRequest({ libraryId: 'removed', state: 'wanted' })],
      new Set(['films']),
    );

    expect(gone).toMatchObject({ state: 'failed' });
    expect(gone?.problem?.message).toMatch(/No library to put this in/u);
  });

  it('leaves a request whose library is there, or which is settled', () => {
    const kept = aShownRequest({ libraryId: 'films', state: 'wanted' });
    const arrived = aShownRequest({ libraryId: 'removed', state: 'available' });

    expect(withLibraryGone([kept, arrived], new Set(['films']))).toEqual([kept, arrived]);
  });
});

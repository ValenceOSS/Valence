import { describe, expect, it } from 'vitest';
import { describeCatalogueCard } from './describeCatalogueCard';
import { IN_LIBRARY_BADGE } from '@ValenceScreens/library/IN_LIBRARY_BADGE';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const aTitle = (standing: CatalogueTitle['standing']): CatalogueTitle => ({
  kind: 'film',
  id: 'film:dune',
  title: 'Dune',
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  standing,
});

describe('describeCatalogueCard', () => {
  it('says a title already held in words, and keeps the tick for one that has been watched', () => {
    const held = aTitle({
      status: 'library',
      mediaId: 'media-1',
      requestId: null,
      requestState: null,
    });

    expect(describeCatalogueCard(held)).toEqual({ badges: [IN_LIBRARY_BADGE] });
    expect(describeCatalogueCard(held, true).corner?.label).toBe('Watched');
  });

  it('says nothing, not even what kind it is, for a title there is only to ask for', () => {
    const drawn = describeCatalogueCard(
      aTitle({ status: 'askable', mediaId: null, requestId: null, requestState: null }),
    );

    expect(drawn.corner).toBeUndefined();
    expect(drawn.badges).toEqual([]);
  });

  it('still says how far a request has got in words', () => {
    const drawn = describeCatalogueCard(
      aTitle({ status: 'requested', mediaId: null, requestId: 'r1', requestState: 'downloading' }),
    );

    expect(drawn.corner).toBeUndefined();
    expect(drawn.badges.map((badge) => badge.label)).toEqual(['Downloading']);
  });
});

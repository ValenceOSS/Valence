import { describe, expect, it } from 'vitest';
import { describeCatalogueCard } from './describeCatalogueCard';
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
  it('marks a title already held with a corner mark, rather than a badge that says so', () => {
    const drawn = describeCatalogueCard(
      aTitle({ status: 'library', mediaId: 'media-1', requestId: null, requestState: null }),
    );

    expect(drawn.corner?.label).toBe('In your library');
    expect(drawn.badges).toEqual(['Film']);
  });

  it('says nothing of it for a title there is only to ask for', () => {
    const drawn = describeCatalogueCard(
      aTitle({ status: 'askable', mediaId: null, requestId: null, requestState: null }),
    );

    expect(drawn.corner).toBeUndefined();
    expect(drawn.badges).toEqual(['Film']);
  });

  it('still says how far a request has got in words', () => {
    const drawn = describeCatalogueCard(
      aTitle({ status: 'requested', mediaId: null, requestId: 'r1', requestState: 'downloading' }),
    );

    expect(drawn.corner).toBeUndefined();
    expect(drawn.badges).toEqual(['Film', 'Downloading']);
  });
});

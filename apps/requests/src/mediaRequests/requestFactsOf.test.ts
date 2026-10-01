import { describe, expect, it } from 'vitest';
import { RequestCatalogueSchema } from '@ValenceContracts/schemas/MediaRequest';
import { requestFactsOf } from './requestFactsOf';

describe('requestFactsOf', () => {
  it('keeps what a request needs of the catalogue, and not its episodes', () => {
    const facts = requestFactsOf(RequestCatalogueSchema.parse({ title: 'Dune', year: 2021 }));

    expect(facts).toMatchObject({ title: 'Dune', year: 2021, isEnded: false });
    expect('episodes' in facts).toBe(false);
    expect('tvdbId' in facts).toBe(false);
  });

  it('keeps the TVDB id where the catalogue gives one', () => {
    expect(
      requestFactsOf(
        RequestCatalogueSchema.parse({ title: 'Severance', year: 2022, tvdbId: 371_980 }),
      ),
    ).toMatchObject({ tvdbId: 371_980 });
  });
});

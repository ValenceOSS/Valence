import { describe, expect, it } from 'vitest';
import { RequestCatalogueSchema } from '@ValenceContracts/schemas/MediaRequest';
import { requestFactsOf } from './requestFactsOf';

describe('requestFactsOf', () => {
  it('keeps what a request needs of the catalogue, and not its episodes', () => {
    const facts = requestFactsOf(RequestCatalogueSchema.parse({ title: 'Dune', year: 2021 }));

    expect(facts).toMatchObject({ title: 'Dune', year: 2021, isEnded: false });
    expect('episodes' in facts).toBe(false);
  });
});

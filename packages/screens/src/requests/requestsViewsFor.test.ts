import { describe, expect, it } from 'vitest';
import { requestsViewsFor } from './requestsViewsFor';

describe('requestsViewsFor', () => {
  it('offers only the views a library takes requests for, with Discover and your own', () => {
    expect(requestsViewsFor(new Set(['film', 'album'])).map((view) => view.id)).toEqual([
      'discover',
      'film:popular',
      'music',
      'mine',
    ]);
  });
});

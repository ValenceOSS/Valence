import { describe, expect, it, vi } from 'vitest';
import { requestsChoicesFor } from './requestsChoicesFor';
import { MEDIA_REQUEST_KINDS } from '@ValenceContracts/schemas/MediaRequest';

const EVERY_KIND = new Set(MEDIA_REQUEST_KINDS);

describe('requestsChoicesFor', () => {
  it('offers every view, Discover first and your own requests last', () => {
    expect(
      requestsChoicesFor(null, vi.fn(), EVERY_KIND).options.map((option) => option.label),
    ).toEqual(['Discover', 'Movies', 'Shows', 'Music', 'Books', 'Requests']);
  });

  it('marks the view the address is showing', () => {
    expect(requestsChoicesFor('series:trending', vi.fn(), EVERY_KIND).selectedId).toBe(
      'series:popular',
    );
  });

  it('asks for no view at all when Discover is chosen', () => {
    const onSelect = vi.fn();

    requestsChoicesFor('music', onSelect, EVERY_KIND).onSelect('discover');

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('offers no view of a kind no library takes requests for', () => {
    expect(
      requestsChoicesFor(null, vi.fn(), new Set(['film'] as const)).options.map(
        (option) => option.label,
      ),
    ).toEqual(['Discover', 'Movies', 'Requests']);
  });

  it('passes any other view on as it is', () => {
    const onSelect = vi.fn();

    requestsChoicesFor(null, onSelect, EVERY_KIND).onSelect('books');

    expect(onSelect).toHaveBeenCalledWith('books');
  });
});

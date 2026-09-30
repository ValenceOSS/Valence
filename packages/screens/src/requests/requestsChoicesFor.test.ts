import { describe, expect, it, vi } from 'vitest';
import { requestsChoicesFor } from './requestsChoicesFor';

describe('requestsChoicesFor', () => {
  it('offers every view, Discover first and your own requests last', () => {
    expect(requestsChoicesFor(null, vi.fn()).options.map((option) => option.label)).toEqual([
      'Discover',
      'Movies',
      'Shows',
      'Music',
      'Books',
      'Requests',
    ]);
  });

  it('marks the view the address is showing', () => {
    expect(requestsChoicesFor('series:trending', vi.fn()).selectedId).toBe('series:popular');
  });

  it('asks for no view at all when Discover is chosen', () => {
    const onSelect = vi.fn();

    requestsChoicesFor('music', onSelect).onSelect('discover');

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('passes any other view on as it is', () => {
    const onSelect = vi.fn();

    requestsChoicesFor(null, onSelect).onSelect('books');

    expect(onSelect).toHaveBeenCalledWith('books');
  });
});

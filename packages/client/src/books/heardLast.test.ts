import { afterEach, describe, expect, it, vi } from 'vitest';
import { heardLast } from '@ValenceClient/books/heardLast';

afterEach(() => {
  heardLast.forget();
});

describe('heardLast', () => {
  it('has heard nothing to begin with', () => {
    expect(heardLast.read()).toBeNull();
  });

  it('keeps whichever was heard last, telling whoever listens as it changes', () => {
    const listener = vi.fn();
    const stop = heardLast.subscribe(listener);

    heardLast.hear('book');
    heardLast.hear('book');
    heardLast.hear('music');
    stop();
    heardLast.hear('book');

    expect(heardLast.read()).toBe('book');
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

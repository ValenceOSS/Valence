import { describe, expect, it, vi } from 'vitest';
import { listeningKept } from '@ValenceClient/books/listeningKept';

describe('listeningKept', () => {
  it('tells whoever listens which book was kept, until they stop', () => {
    const listener = vi.fn();
    const stop = listeningKept.subscribe(listener);

    listeningKept.tell('book-1');
    stop();
    listeningKept.tell('book-2');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('book-1');
  });
});

import { describe, expect, it } from 'vitest';
import { aFakeStore } from './aFakeStore';

describe('aFakeStore', () => {
  it('reads what it was given and forgets it', () => {
    const store = aFakeStore();

    store.write('a', 'b');

    expect(store.read('a')).toBe('b');

    store.forget('a');

    expect(store.read('a')).toBeNull();
  });
});

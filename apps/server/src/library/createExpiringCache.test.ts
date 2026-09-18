import { describe, expect, it } from 'vitest';
import { createExpiringCache } from './createExpiringCache';

describe('createExpiringCache', () => {
  it('hands back what it was given, while it is still young', () => {
    const cache = createExpiringCache<string>(1000, { now: () => 0 });

    cache.set('from', 'a series');

    expect(cache.get('from')).toBe('a series');
  });

  it('says nothing about a key it was never given', () => {
    expect(createExpiringCache<string>(1000).get('missing')).toBeUndefined();
  });

  it('forgets an entry once it has lived its time, so the answer is asked for again', () => {
    let clock = 0;
    const cache = createExpiringCache<string>(1000, { now: () => clock });

    cache.set('from', 'one season');
    clock = 1000;

    expect(cache.get('from')).toBeUndefined();
  });

  it('keeps an entry right up to the moment it expires', () => {
    let clock = 0;
    const cache = createExpiringCache<string>(1000, { now: () => clock });

    cache.set('from', 'one season');
    clock = 999;

    expect(cache.get('from')).toBe('one season');
  });

  it('starts the clock again when an entry is replaced', () => {
    let clock = 0;
    const cache = createExpiringCache<string>(1000, { now: () => clock });

    cache.set('from', 'one season');
    clock = 900;
    cache.set('from', 'two seasons');
    clock = 1800;

    expect(cache.get('from')).toBe('two seasons');
  });
});

describe('what it holds at most', () => {
  it('forgets the one written first once it is over its bound', () => {
    const cache = createExpiringCache<string>(1000, { holds: 2, now: () => 0 });

    cache.set('one', 'a');
    cache.set('two', 'b');
    cache.set('three', 'c');

    expect(cache.get('one')).toBeUndefined();
    expect(cache.get('two')).toBe('b');
    expect(cache.get('three')).toBe('c');
  });

  it('holds everything when it was given no bound', () => {
    const cache = createExpiringCache<string>(1000, { now: () => 0 });

    for (const key of ['one', 'two', 'three']) {
      cache.set(key, key);
    }

    expect(cache.get('one')).toBe('one');
  });

  it('forgets everything it holds when emptied', () => {
    const cache = createExpiringCache<string>(1000);

    cache.set('a', 'one');
    cache.set('b', 'two');
    cache.clear();

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});

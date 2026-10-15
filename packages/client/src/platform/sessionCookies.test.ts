import { describe, expect, it } from 'vitest';
import { sessionCookies } from './sessionCookies';

/**
 * A cookie jar that behaves as a document's: writing one cookie sets or removes only that one.
 *
 * @returns The jar, and what was written to it.
 */
const aJar = () => {
  const held = new Map<string, string>();
  const written: string[] = [];
  const jar = {
    get cookie() {
      return [...held].map(([key, value]) => `${key}=${value}`).join('; ');
    },
    set cookie(line: string) {
      written.push(line);

      const [pair = '', ...rest] = line.split('; ');
      const at = pair.indexOf('=');
      const key = pair.slice(0, at);

      if (rest.includes('max-age=0')) {
        held.delete(key);
      } else {
        held.set(key, pair.slice(at + 1));
      }
    },
  };

  return { jar, written };
};

describe('sessionCookies', () => {
  it('keeps a value, and reads it back', () => {
    const { jar } = aJar();
    const storage = sessionCookies(() => jar);

    storage.setItem('valence.chosen', 'account 1');

    expect(storage.getItem('valence.chosen')).toBe('account 1');
    expect(storage.getItem('valence.other')).toBeNull();
  });

  it('keeps it only for the browser session, for the whole site, and never sends it elsewhere', () => {
    const { jar, written } = aJar();

    sessionCookies(() => jar).setItem('valence.chosen', 'a');

    expect(written).toEqual(['valence.chosen=a; path=/; SameSite=Strict']);
  });

  it('forgets a value', () => {
    const { jar } = aJar();
    const storage = sessionCookies(() => jar);

    storage.setItem('valence.chosen', 'a');
    storage.removeItem('valence.chosen');

    expect(storage.getItem('valence.chosen')).toBeNull();
  });

  it('reads one cookie among others', () => {
    const { jar } = aJar();
    const storage = sessionCookies(() => jar);

    storage.setItem('first', '1');
    storage.setItem('second', '2');

    expect(storage.getItem('second')).toBe('2');
  });
});

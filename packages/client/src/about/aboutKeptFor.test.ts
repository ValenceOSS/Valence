import { describe, expect, it } from 'vitest';
import { aboutKeptFor } from '@ValenceClient/about/aboutKeptFor';

describe('aboutKeptFor', () => {
  it('keeps the server’s build for good once it has said it', () => {
    expect(aboutKeptFor({ version: '1.4.0', commit: 'e68dd35', features: [] })).toBe(Infinity);
    expect(aboutKeptFor({ commit: 'e68dd35', features: [] })).toBe(Infinity);
  });

  it('asks again where the server kept its build back, so it appears once somebody signs in', () => {
    expect(aboutKeptFor({ features: [] })).toBe(0);
    expect(aboutKeptFor(undefined)).toBe(0);
  });
});

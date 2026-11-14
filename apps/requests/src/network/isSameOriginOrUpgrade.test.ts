import { describe, expect, it } from 'vitest';
import { isSameOriginOrUpgrade } from './isSameOriginOrUpgrade';

describe('isSameOriginOrUpgrade', () => {
  it('accepts the same origin, and the same host upgraded to https', () => {
    expect(isSameOriginOrUpgrade('https://mirror.example/', 'https://mirror.example/a')).toBe(true);
    expect(isSameOriginOrUpgrade('http://mirror.example:8080/', 'https://mirror.example/a')).toBe(
      true,
    );
    expect(isSameOriginOrUpgrade('http://mirror.example/', 'https://mirror.example/a')).toBe(true);
  });

  it('refuses another host, another port, or a downgrade', () => {
    expect(isSameOriginOrUpgrade('http://mirror.example/', 'https://other.example/a')).toBe(false);
    expect(isSameOriginOrUpgrade('http://mirror.example/', 'https://mirror.example:8443/a')).toBe(
      false,
    );
    expect(isSameOriginOrUpgrade('https://mirror.example/', 'http://mirror.example/a')).toBe(false);
    expect(isSameOriginOrUpgrade('https://mirror.example/', 'not an address')).toBe(false);
  });
});

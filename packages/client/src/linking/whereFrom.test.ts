import { describe, expect, it } from 'vitest';
import { whereFrom } from './whereFrom';

describe('whereFrom', () => {
  it('says nothing about something of this server’s own', () => {
    expect(whereFrom(null)).toBeNull();
  });

  it('says which server it comes from', () => {
    expect(whereFrom({ name: 'Films', label: 'From Films', isReachable: true })).toBe('From Films');
  });

  it('says the server cannot be reached, where it cannot', () => {
    expect(whereFrom({ name: 'Films', label: 'From Films', isReachable: false })).toBe(
      'Films can’t be reached right now. You can browse its titles, but you can’t play them until it’s back online.',
    );
  });
});

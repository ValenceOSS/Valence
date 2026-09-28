import { describe, expect, it } from 'vitest';
import { sharedStart } from './sharedStart';

describe('sharedStart', () => {
  it('finds the start two names share, whatever their case', () => {
    expect(sharedStart('Heat (1995) 1080p', 'heat (1995) - Director’s Cut')).toBe('Heat (1995) ');
  });

  it('shares nothing where they start differently', () => {
    expect(sharedStart('Alien', 'Heat')).toBe('');
  });
});

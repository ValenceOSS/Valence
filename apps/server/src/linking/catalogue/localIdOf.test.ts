import { describe, expect, it } from 'vitest';
import { localIdOf } from './localIdOf';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

describe('localIdOf', () => {
  it('gives the same thing from the same server the same id every time, shaped as a UUID', () => {
    expect(localIdOf('films', 'arrival')).toBe(localIdOf('films', 'arrival'));
    expect(localIdOf('films', 'arrival')).toMatch(UUID);
  });

  it('gives the same thing from another server, or another thing, an id of its own', () => {
    expect(localIdOf('films', 'arrival')).not.toBe(localIdOf('books', 'arrival'));
    expect(localIdOf('films', 'arrival')).not.toBe(localIdOf('films', 'alien'));
  });
});

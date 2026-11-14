import { describe, expect, it } from 'vitest';
import { personJellyfinId } from './personJellyfinId';
import { personOfJellyfinId } from './personOfJellyfinId';
import { uuidOfJellyfinId } from './uuidOfJellyfinId';

describe('personJellyfinId', () => {
  it('is thirty-two digits that turn back into the person', () => {
    const id = personJellyfinId(4495);

    expect(id).toMatch(/^[0-9a-f]{32}$/u);
    expect(personOfJellyfinId(id)).toBe(4495);
  });

  it('carries a version no UUID Valence makes has', () => {
    expect(uuidOfJellyfinId(personJellyfinId(1))?.[14]).toBe('0');
  });
});

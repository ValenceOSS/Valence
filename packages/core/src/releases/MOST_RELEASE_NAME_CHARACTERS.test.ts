import { describe, expect, it } from 'vitest';
import { MOST_RELEASE_NAME_CHARACTERS } from './MOST_RELEASE_NAME_CHARACTERS';
import { parseReleaseName } from './parseReleaseName';

describe('MOST_RELEASE_NAME_CHARACTERS', () => {
  it('is five hundred, and a release name is read no further', () => {
    expect(MOST_RELEASE_NAME_CHARACTERS).toBe(500);
    expect(parseReleaseName(`${'x'.repeat(MOST_RELEASE_NAME_CHARACTERS)} 2160p`).resolution).toBe(
      null,
    );
  });
});

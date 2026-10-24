import { describe, expect, it } from 'vitest';
import { VALENCE_REPOSITORY_URL } from './VALENCE_REPOSITORY_URL';

describe('VALENCE_REPOSITORY_URL', () => {
  it('names the repository under its organisation', () => {
    expect(VALENCE_REPOSITORY_URL).toBe('https://github.com/ValenceOSS/Valence');
  });
});

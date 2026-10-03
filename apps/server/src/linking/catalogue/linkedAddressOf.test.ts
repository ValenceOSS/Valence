import { describe, expect, it } from 'vitest';
import { linkedAddressOf } from './linkedAddressOf';

const FILMS = '00000000-0000-4000-8000-0000000000f1';

describe('linkedAddressOf', () => {
  it('names the linked server and the route on it', () => {
    expect(linkedAddressOf(FILMS, '/api/media/one/image/poster')).toBe(
      `linked://${FILMS}/api/media/one/image/poster`,
    );
  });
});

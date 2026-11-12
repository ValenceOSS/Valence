import { describe, expect, it } from 'vitest';
import { framedPictureUrl } from './framedPictureUrl';

describe('framedPictureUrl', () => {
  it('asks for the framed square of a picture, keeping the rest of its address', () => {
    expect(framedPictureUrl('/api/profiles/p1/avatar?v=2026')).toBe(
      '/api/profiles/p1/avatar?v=2026&framed=1',
    );
    expect(framedPictureUrl('/api/account/avatar')).toBe('/api/account/avatar?framed=1');
  });
});

import { describe, expect, it } from 'vitest';
import { JELLYFIN_BASE_PATH } from './JELLYFIN_BASE_PATH';

describe('JELLYFIN_BASE_PATH', () => {
  it('is the address Jellyfin apps are given to add', () => {
    expect(JELLYFIN_BASE_PATH).toBe('/jellyfin');
  });
});

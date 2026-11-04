import { describe, expect, it } from 'vitest';
import { anAdminShare } from '@ValenceScreens/testing/anAdminShare';

describe('anAdminShare', () => {
  it('is a live link never opened, with what a test changes', () => {
    expect(anAdminShare()).toMatchObject({ views: 0, isRevoked: false, expiresAt: null });
    expect(anAdminShare({ views: 3 }).views).toBe(3);
  });
});

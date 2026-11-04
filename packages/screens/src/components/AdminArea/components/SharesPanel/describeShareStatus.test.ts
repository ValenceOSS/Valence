import { describe, expect, it } from 'vitest';
import { describeShareStatus } from './describeShareStatus';
import { anAdminShare } from '@ValenceScreens/testing/anAdminShare';

const NOW = Date.parse('2026-11-04T12:00:00.000Z');

describe('describeShareStatus', () => {
  it('says a revoked link is revoked, whatever else is true of it', () => {
    expect(describeShareStatus(anAdminShare({ isRevoked: true, isSpent: true }), NOW)).toBe(
      'Revoked',
    );
  });

  it('says when a link expired', () => {
    expect(
      describeShareStatus(anAdminShare({ expiresAt: '2026-11-01T12:00:00.000Z' }), NOW),
    ).toMatch(/^Expired /u);
  });

  it('says a link opened as often as it allows is used up', () => {
    expect(describeShareStatus(anAdminShare({ isSpent: true }), NOW)).toBe('All opens used');
  });

  it('says how long a live link has left, or that it has no end', () => {
    expect(describeShareStatus(anAdminShare(), NOW)).toBe('No end date');
    expect(describeShareStatus(anAdminShare({ expiresAt: '2026-11-04T20:00:00.000Z' }), NOW)).toBe(
      'Ends today',
    );
    expect(describeShareStatus(anAdminShare({ expiresAt: '2026-11-07T12:00:00.000Z' }), NOW)).toBe(
      'Ends in 3 days',
    );
  });
});

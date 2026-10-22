import { describe, expect, it } from 'vitest';
import { auditExpiry } from './auditExpiry';

describe('auditExpiry', () => {
  it('keeps sign-ins for 90 days and everything else for a year', () => {
    expect(auditExpiry(new Date(Date.UTC(2026, 9, 22)))).toEqual({
      signIns: new Date(Date.UTC(2026, 6, 24)),
      changes: new Date(Date.UTC(2025, 9, 22)),
    });
  });
});

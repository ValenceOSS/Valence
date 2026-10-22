import { describe, expect, it } from 'vitest';
import { AuditQuerySchema } from '@ValenceContracts/schemas/Audit';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';
import { auditEntryMatches } from './auditEntryMatches';

const ENTRY: AuditEntry = {
  id: 'one',
  at: '2026-10-22T03:00:00.000Z',
  actorId: 'amara',
  actorName: 'Amara',
  action: 'auth.signInFailed',
  target: 'tom@example.com',
  detail: null,
  address: '203.0.113.7',
  userAgent: null,
};

const asked = (query: Record<string, string | number>) => AuditQuerySchema.parse(query);

describe('auditEntryMatches', () => {
  it('narrows by kind of change, and by the change itself', () => {
    expect(auditEntryMatches(ENTRY, asked({ category: 'auth' }))).toBe(true);
    expect(auditEntryMatches(ENTRY, asked({ category: 'account' }))).toBe(false);
    expect(auditEntryMatches(ENTRY, asked({ action: 'auth.signedIn' }))).toBe(false);
  });

  it('narrows by when', () => {
    const at = Date.parse(ENTRY.at);

    expect(auditEntryMatches(ENTRY, asked({ sinceMs: at, untilMs: at }))).toBe(true);
    expect(auditEntryMatches(ENTRY, asked({ sinceMs: at + 1 }))).toBe(false);
  });

  it('finds words in who, what or where, whatever their case', () => {
    expect(auditEntryMatches(ENTRY, asked({ search: 'AMARA' }))).toBe(true);
    expect(auditEntryMatches(ENTRY, asked({ search: 'tom@' }))).toBe(true);
    expect(auditEntryMatches(ENTRY, asked({ search: '203.0.113' }))).toBe(true);
    expect(auditEntryMatches(ENTRY, asked({ search: 'nobody' }))).toBe(false);
  });
});

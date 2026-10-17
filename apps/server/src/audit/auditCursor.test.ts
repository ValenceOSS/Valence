import { describe, expect, it } from 'vitest';
import { readAuditCursor, writeAuditCursor } from './auditCursor';

describe('auditCursor', () => {
  it('reads back where it was written', () => {
    const place = { at: new Date('2026-10-17T03:04:05.678Z'), id: 'a_b-c' };

    expect(readAuditCursor(writeAuditCursor(place))).toEqual(place);
  });

  it.each(['', 'nonsense', '_id', '12_'])('refuses %s', (cursor) => {
    expect(readAuditCursor(cursor)).toBeNull();
  });
});

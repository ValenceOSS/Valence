import { describe, expect, it } from 'vitest';
import { describeScanResult } from './describeScanResult';

const aScan = (overrides: Partial<Parameters<typeof describeScanResult>[0]> = {}) => ({
  added: 0,
  updated: 0,
  removed: 0,
  failed: 0,
  ...overrides,
});

describe('describeScanResult', () => {
  it('says nothing changed rather than showing three zeros', () => {
    expect(describeScanResult(aScan())).toBe('Nothing changed');
  });

  it('counts what a scan found, leaving out what did not happen', () => {
    expect(describeScanResult(aScan({ added: 4, updated: 1 }))).toBe('4 added 1 changed');
  });

  it('says how many were removed', () => {
    expect(describeScanResult(aScan({ removed: 214 }))).toBe('214 removed');
  });

  it('says what went missing and what came back, even when nothing else changed', () => {
    expect(describeScanResult(aScan({ missing: 3 }))).toBe('3 missing');
    expect(describeScanResult(aScan({ returned: 1 }))).toBe('1 back');
  });

  it('names unreadable files only when there are some', () => {
    expect(describeScanResult(aScan({ added: 1, failed: 2 }))).toContain('2 unreadable');
    expect(describeScanResult(aScan({ added: 1 }))).not.toContain('unreadable');
  });
});

import { describe, expect, it } from 'vitest';
import { mergeAuditDetail } from './mergeAuditDetail';

describe('mergeAuditDetail', () => {
  it('lists every setting changed across the changes, each once', () => {
    expect(
      mergeAuditDetail({ settings: 'roundness' }, { settings: 'roundness, hardwareAccel' }),
    ).toEqual({ settings: 'roundness, hardwareAccel' });
  });

  it('takes the later word on anything that is not a list', () => {
    expect(mergeAuditDetail({ to: 'a', library: 'Films' }, { to: 'b' })).toEqual({
      to: 'b',
      library: 'Films',
    });
  });

  it('adds up the attempts, so repeated failures read as one entry with a count', () => {
    expect(
      mergeAuditDetail({ method: 'password', attempts: '4' }, { method: 'passkey', attempts: '1' }),
    ).toEqual({ method: 'passkey', attempts: '5' });
  });

  it('keeps whichever said something where only one did', () => {
    expect(mergeAuditDetail(null, { fields: 'name' })).toEqual({ fields: 'name' });
    expect(mergeAuditDetail({ fields: 'name' }, null)).toEqual({ fields: 'name' });
    expect(mergeAuditDetail(null, null)).toBeNull();
  });
});

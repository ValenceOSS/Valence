import { describe, expect, it } from 'vitest';
import { AUDIT_ACTIONS, AUDIT_CATEGORIES } from '@ValenceContracts/schemas/Audit';
import { auditCategoryOf } from './auditCategoryOf';

describe('auditCategoryOf', () => {
  it('reads the kind of change from the start of the action', () => {
    expect(auditCategoryOf('auth.signInFailed')).toBe('auth');
    expect(auditCategoryOf('media.artworkChosen')).toBe('media');
    expect(auditCategoryOf('request.approved')).toBe('request');
  });

  it('files every action under a kind named for it', () => {
    for (const action of AUDIT_ACTIONS) {
      expect(AUDIT_CATEGORIES).toContain(action.slice(0, action.indexOf('.')));
    }
  });
});

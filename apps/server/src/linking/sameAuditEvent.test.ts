import { describe, expect, it } from 'vitest';
import { sameAuditEvent } from './sameAuditEvent';

const AN_ENTRY = {
  linkedServerId: 'server',
  remotePersonId: 'person',
  action: 'media',
  mediaId: 'film',
  mediaTitle: 'Arrival',
  outcome: 'allowed',
} as const;

describe('sameAuditEvent', () => {
  it('is the same for the same request again, whatever the title was called', () => {
    expect(sameAuditEvent({ ...AN_ENTRY, mediaTitle: 'Arrival (2016)' })).toBe(
      sameAuditEvent(AN_ENTRY),
    );
  });

  it('differs by person, title and outcome', () => {
    const key = sameAuditEvent(AN_ENTRY);

    expect(sameAuditEvent({ ...AN_ENTRY, remotePersonId: null })).not.toBe(key);
    expect(sameAuditEvent({ ...AN_ENTRY, mediaId: 'another' })).not.toBe(key);
    expect(sameAuditEvent({ ...AN_ENTRY, outcome: 'blocked' })).not.toBe(key);
  });
});

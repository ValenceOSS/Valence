import { describe, expect, it } from 'vitest';
import type { AuditEntry } from '@ValenceContracts/schemas/Audit';
import { describeAuditDetail } from './describeAuditDetail';

const anEntry = (entry: Partial<AuditEntry>): AuditEntry => ({
  id: 'one',
  at: '2026-10-22T03:00:00.000Z',
  actorId: 'amara',
  actorName: 'Amara',
  action: 'media.removed',
  target: 'A Show',
  detail: null,
  address: null,
  userAgent: null,
  ...entry,
});

describe('describeAuditDetail', () => {
  it('says which episode was deleted, and from which library', () => {
    expect(
      describeAuditDetail(
        anEntry({
          detail: { episodeTitle: 'Pilot', season: '1', episode: '2', library: 'Shows' },
        }),
      ),
    ).toEqual(['Episode called Pilot', 'Season 1, episode 2', 'In Shows']);
  });

  it('names the settings changed rather than their codes', () => {
    expect(
      describeAuditDetail(
        anEntry({
          action: 'settings.changed',
          target: null,
          detail: { settings: 'roundness, hardwareAccel, somethingNew' },
        }),
      ),
    ).toEqual(['Roundness, Hardware acceleration, and Something new']);
  });

  it('says how somebody signed in', () => {
    expect(
      describeAuditDetail(anEntry({ action: 'auth.signedIn', detail: { method: 'passkey' } })),
    ).toEqual(['With a passkey']);
  });

  it('counts the failed attempts folded into one entry, and leaves a single one uncounted', () => {
    const failed = (attempts: string) =>
      describeAuditDetail(
        anEntry({ action: 'auth.signInFailed', detail: { method: 'password', attempts } }),
      );

    expect(failed('12')).toEqual(['With a password', '12 attempts']);
    expect(failed('1')).toEqual(['With a password']);
  });

  it('names the job started, by what the server calls it', () => {
    expect(
      describeAuditDetail(
        anEntry({ action: 'job.started', target: 'Films', detail: { job: 'library.scan' } }),
        new Map([['library.scan', 'Scan the library']]),
      ),
    ).toEqual(['Scan the library']);
  });

  it('says what a permission set for one account now does', () => {
    expect(
      describeAuditDetail(
        anEntry({
          action: 'account.permissionsChanged',
          detail: { permission: 'requests.manage', effect: 'deny' },
        }),
      ),
    ).toHaveLength(1);
  });

  it('counts the files, and gives the reason an administrator wrote', () => {
    expect(
      describeAuditDetail(
        anEntry({
          action: 'account.banned',
          detail: { files: '3', reason: 'Shared the password' },
        }),
      ),
    ).toEqual(['3 files', 'Reason given: Shared the password']);
  });

  it('says nothing for an entry that kept nothing', () => {
    expect(describeAuditDetail(anEntry({}))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { skipReasonOf } from './skipReasonOf';
import type { SourceUser } from './SourceReader';

const USER: SourceUser = {
  id: 'u',
  name: 'U',
  username: null,
  email: null,
  isAdministrator: false,
  isDisabled: false,
  access: 'readable',
  libraryAccess: { kind: 'all' },
  ceiling: null,
  avatarUrl: null,
};

describe('skipReasonOf', () => {
  it('leaves out who the administrator chose to leave out', () => {
    expect(skipReasonOf(USER, { skipUserIds: ['u'] })?.code).toBe(
      'server.imports.skipReasonOf.youLeftThemOut',
    );
  });

  it('leaves out a Plex Home member whose PIN was not given', () => {
    expect(skipReasonOf({ ...USER, access: 'needsPin' }, { skipUserIds: [] })?.code).toBe(
      'server.imports.skipReasonOf.theirPinWasNotGiven',
    );
  });

  it('brings everybody else across', () => {
    expect(skipReasonOf({ ...USER, access: 'unreadable' }, { skipUserIds: [] })).toBeNull();
  });
});

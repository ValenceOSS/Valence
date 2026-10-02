import { describe, expect, it } from 'vitest';
import {
  ConnectMediaImportSchema,
  MediaImportReportPersonSchema,
  PlanMediaImportSchema,
  PlexPinSchema,
} from './MediaImport';

describe('MediaImport', () => {
  it('takes a server to connect only with an address and a key', () => {
    expect(
      ConnectMediaImportSchema.safeParse({
        kind: 'plex',
        url: ' http://192.168.1.10:32400 ',
        token: ' t ',
      }),
    ).toMatchObject({
      success: true,
      data: { url: 'http://192.168.1.10:32400', token: 't' },
    });
    expect(
      ConnectMediaImportSchema.safeParse({ kind: 'kodi', url: 'http://x', token: 't' }).success,
    ).toBe(false);
    expect(
      ConnectMediaImportSchema.safeParse({ kind: 'emby', url: 'not an address', token: 't' })
        .success,
    ).toBe(false);
  });

  it('takes a Plex PIN of four digits only', () => {
    expect(PlexPinSchema.safeParse({ userId: '1', pin: '0123' }).success).toBe(true);
    expect(PlexPinSchema.safeParse({ userId: '1', pin: '123' }).success).toBe(false);
  });

  it('plans with nobody left out and nobody named as the administrator unless said', () => {
    expect(PlanMediaImportSchema.parse({})).toEqual({ skipUserIds: [], meUserId: null });
  });

  it('reads a person in a report written before they were brought across', () => {
    expect(
      MediaImportReportPersonSchema.parse({
        sourceUserId: 'u',
        name: 'U',
        username: null,
        email: null,
        isAdministrator: false,
        isDisabled: false,
        isYou: false,
        skipped: null,
        watched: 0,
        resumes: 0,
        plays: 0,
        favourites: 0,
        ratings: 0,
        playlists: 0,
        libraries: null,
        maximumAge: null,
      }),
    ).toMatchObject({ userId: null, outcome: null });
  });
});

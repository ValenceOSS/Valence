import { describe, expect, it } from 'vitest';
import {
  FederationActivitySchema,
  LinkSharingChangeSchema,
  SharedLibrariesSchema,
} from './LinkSharing';

describe('LinkSharing', () => {
  it('takes a change to only some of what a link shares', () => {
    expect(LinkSharingChangeSchema.parse({ namesTravel: false })).toEqual({ namesTravel: false });
    expect(LinkSharingChangeSchema.safeParse({ maximumAge: 22 }).success).toBe(false);
    expect(LinkSharingChangeSchema.safeParse({ libraryIds: ['films'] }).success).toBe(false);
  });

  it('reads what another server shares, and only libraries of a kind this one knows', () => {
    const films = { id: '00000000-0000-4000-8000-000000000001', name: 'Films', kind: 'movies' };

    expect(SharedLibrariesSchema.parse({ libraries: [films] }).libraries).toHaveLength(1);
    expect(
      SharedLibrariesSchema.safeParse({ libraries: [{ ...films, kind: 'games' }] }).success,
    ).toBe(false);
  });

  it('reads an entry of activity, and refuses an outcome it does not know', () => {
    const entry = {
      id: '00000000-0000-4000-8000-000000000002',
      at: '2026-10-02T12:00:00.000Z',
      personId: null,
      personName: null,
      action: 'libraries',
      mediaTitle: null,
      outcome: 'allowed',
      count: 1,
    };

    expect(FederationActivitySchema.parse(entry)).toEqual(entry);
    expect(FederationActivitySchema.safeParse({ ...entry, outcome: 'maybe' }).success).toBe(false);
  });
});

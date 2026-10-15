import { describe, expect, it } from 'vitest';
import {
  MayRequestSchema,
  ProfileCeilingRequestSchema,
  ProfileLibrariesSchema,
  ProfileLibrarySchema,
} from './ProfileLibraries';

const library = {
  id: 'lib-1',
  name: 'Films',
  mayView: true,
  maximumAge: 12,
  allowsUnrated: false,
  accountMaximumAge: 15,
};

describe('ProfileLibrarySchema', () => {
  it('reads a library as the server sends it', () => {
    expect(ProfileLibrarySchema.parse(library)).toEqual(library);
  });

  it('reads a library with no age limit on the profile or the account', () => {
    const open = { ...library, maximumAge: null, accountMaximumAge: null };

    expect(ProfileLibrarySchema.parse(open)).toEqual(open);
  });

  it('refuses an age below nought, above twenty-one or between whole years', () => {
    expect(ProfileLibrarySchema.safeParse({ ...library, maximumAge: -1 }).success).toBe(false);
    expect(ProfileLibrarySchema.safeParse({ ...library, maximumAge: 22 }).success).toBe(false);
    expect(ProfileLibrarySchema.safeParse({ ...library, accountMaximumAge: 12.5 }).success).toBe(
      false,
    );
  });

  it('insists every field is said', () => {
    const missing = {
      id: 'lib-1',
      name: 'Films',
      mayView: true,
      maximumAge: 12,
      accountMaximumAge: 15,
    };

    expect(ProfileLibrarySchema.safeParse(missing).success).toBe(false);
  });
});

describe('ProfileLibrariesSchema', () => {
  it('reads the list the libraries endpoint answers with', () => {
    expect(ProfileLibrariesSchema.parse({ libraries: [library] }).libraries).toHaveLength(1);
    expect(ProfileLibrariesSchema.parse({ libraries: [] }).libraries).toEqual([]);
  });

  it('refuses a list with a broken library in it', () => {
    expect(ProfileLibrariesSchema.safeParse({ libraries: [{ id: 'lib-1' }] }).success).toBe(false);
  });
});

describe('ProfileCeilingRequestSchema', () => {
  it('reads a ceiling and leaves unrated titles out unless said otherwise', () => {
    expect(ProfileCeilingRequestSchema.parse({ maximumAge: 7 })).toEqual({
      maximumAge: 7,
      allowsUnrated: false,
    });
  });

  it('reads a ceiling that lets unrated titles through', () => {
    expect(ProfileCeilingRequestSchema.parse({ maximumAge: 0, allowsUnrated: true })).toEqual({
      maximumAge: 0,
      allowsUnrated: true,
    });
  });

  it('refuses a ceiling with no age, or one out of range', () => {
    expect(ProfileCeilingRequestSchema.safeParse({}).success).toBe(false);
    expect(ProfileCeilingRequestSchema.safeParse({ maximumAge: null }).success).toBe(false);
    expect(ProfileCeilingRequestSchema.safeParse({ maximumAge: 22 }).success).toBe(false);
  });
});

describe('MayRequestSchema', () => {
  it('reads whether a profile may request', () => {
    expect(MayRequestSchema.parse({ mayRequest: true })).toEqual({ mayRequest: true });
    expect(MayRequestSchema.parse({ mayRequest: false })).toEqual({ mayRequest: false });
  });

  it('refuses anything else', () => {
    expect(MayRequestSchema.safeParse({}).success).toBe(false);
    expect(MayRequestSchema.safeParse({ mayRequest: 'yes' }).success).toBe(false);
  });
});

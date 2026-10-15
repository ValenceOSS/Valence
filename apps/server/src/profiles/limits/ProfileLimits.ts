type ProfileCeiling = { libraryId: string; maximumAge: number; allowsUnrated: boolean };

type ProfileLimits = {
  refusedLibraries: (profileId: string) => Promise<string[]>;
  ceilingsFor: (profileId: string) => Promise<ProfileCeiling[]>;
  refuseLibrary: (profileId: string, libraryId: string) => Promise<void>;
  allowLibrary: (profileId: string, libraryId: string) => Promise<void>;
  setCeiling: (profileId: string, ceiling: ProfileCeiling) => Promise<void>;
  clearCeiling: (profileId: string, libraryId: string) => Promise<void>;
};

export type { ProfileCeiling, ProfileLimits };

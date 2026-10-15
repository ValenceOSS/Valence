type ChosenProfiles = {
  chosenFor: (sessionId: string) => Promise<string | null>;
  choose: (sessionId: string, profileId: string) => Promise<void>;
  forget: (sessionId: string) => Promise<void>;
  keyProfileOf: (keyId: string) => Promise<string | null>;
  tieKey: (keyId: string, profileId: string) => Promise<void>;
};

export type { ChosenProfiles };

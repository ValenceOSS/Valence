type ProfileManager =
  | { kind: 'owner'; accountId: string; profileId: string }
  | { kind: 'self'; accountId: string; profileId: string }
  | { kind: 'administrator'; accountId: string; actorId: string };

export type { ProfileManager };

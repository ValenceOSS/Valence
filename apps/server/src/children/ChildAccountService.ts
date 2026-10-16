type ChildAccountService = {
  list: (ownerId: string) => Promise<{ userId: string; hasPin: boolean }[]>;
  ownerOf: (userId: string) => Promise<string | null>;
  adopt: (ownerId: string, userId: string) => Promise<void>;
  pinHashOf: (userId: string) => Promise<string | null>;
  setPinHash: (userId: string, pinHash: string | null) => Promise<void>;
};

export type { ChildAccountService };

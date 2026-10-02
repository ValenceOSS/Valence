import type { SetupLinkLifetime, SetupState } from '@ValenceContracts/schemas/SetupLink';

type IssueOptions = {
  lifetimeDays: SetupLinkLifetime;
  by: string | null;
  origin?: string | undefined;
};

type IssuedLink = { url: string; token: string; expiresAt: Date };

type SetupStanding = { state: SetupState; expiresAt: Date | null };

type LinkedAccount = {
  userId: string;
  name: string;
  username: string | null;
  suggestedUsername: string;
  email: string | null;
  hasPassword: boolean;
  expiresAt: Date;
};

type SetupChanges = { username?: string; email?: string };

type Redemption =
  | { kind: 'redeemed'; userId: string; username: string }
  | { kind: 'gone' }
  | { kind: 'needsUsername' }
  | { kind: 'taken'; field: 'username' | 'email' };

type SetupLinkService = {
  issue: (userId: string, options: IssueOptions) => Promise<IssuedLink>;
  linkFor: (token: string, origin?: string) => string;
  stateOf: (userId: string) => Promise<SetupState>;
  statesOf: (userIds: readonly string[]) => Promise<Map<string, SetupStanding>>;
  revoke: (userId: string) => Promise<void>;
  inspect: (token: string) => Promise<LinkedAccount | null>;
  redeem: (token: string, changes: SetupChanges) => Promise<Redemption>;
};

export type {
  IssueOptions,
  IssuedLink,
  LinkedAccount,
  Redemption,
  SetupChanges,
  SetupLinkService,
  SetupStanding,
};

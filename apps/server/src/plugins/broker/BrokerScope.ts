type BrokerScope =
  | { kind: 'viewer'; profileId: string; accountId: string; isAdmin: boolean }
  | { kind: 'background' };

export type { BrokerScope };

type Viewer =
  | {
      kind: 'account';
      accountId: string;
      profileId: string | null;
      isAdministrator: boolean;
    }
  | {
      kind: 'guest';
      shareId: string;
    }
  | {
      kind: 'server';
    };

export type { Viewer };

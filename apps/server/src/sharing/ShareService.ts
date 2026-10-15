import type {
  AdminShare,
  CreatedShare,
  NewShare,
  Share,
  ShareKind,
} from '@ValenceContracts/schemas/Share';

type ResolvedShare = {
  id: string;
  createdBy: string;
  createdByName: string | null;
  kind: ShareKind;
  mediaId: string | null;
  seriesId: string | null;
  bookId: string | null;
  title: string;
  expiresAt: Date | null;
  viewCap: number | null;
  views: number;
  revokedAt: Date | null;
};

type WithdrawnShare = {
  createdBy: string;
  createdByProfileId: string | null;
  title: string;
};

type ShareService = {
  create: (
    createdBy: string,
    asked: NewShare,
    profileId: string | null,
  ) => Promise<CreatedShare | null>;
  list: (createdBy: string, onlyProfileId: string | null) => Promise<Share[]>;
  listEverybody: () => Promise<AdminShare[]>;
  revoke: (createdBy: string, shareId: string, onlyProfileId: string | null) => Promise<boolean>;
  revokeAnybody: (shareId: string) => Promise<WithdrawnShare | null>;
  resolve: (token: string) => Promise<ResolvedShare | null>;
  join: (shareId: string, joiner: string) => Promise<void>;
  hasJoined: (shareId: string, joiner: string) => Promise<boolean>;
};

export type { ShareService, ResolvedShare, WithdrawnShare };

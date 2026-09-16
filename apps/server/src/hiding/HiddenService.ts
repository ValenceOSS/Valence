import type { Hidden, HiddenKind } from '@ValenceContracts/schemas/Hidden';

type HiddenSubject = {
  kind: HiddenKind;
  subjectId: string;
};

type HiddenService = {
  list: (profileId: string) => Promise<Hidden[]>;
  hide: (profileId: string, subject: HiddenSubject) => Promise<boolean>;
  show: (profileId: string, subject: HiddenSubject) => Promise<boolean>;
};

export type { HiddenService, HiddenSubject };

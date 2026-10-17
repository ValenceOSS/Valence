import type { UpdateCheck } from '@ValenceContracts/schemas/UpdateCheck';

type UpdateChecker = {
  read: (isForced?: boolean) => Promise<UpdateCheck>;
};

export type { UpdateChecker };

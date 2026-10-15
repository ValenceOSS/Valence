import type { Advisory } from '@ValenceContracts/schemas/Advisory';

type ContentAdvisoryProps = {
  certification: string | null;
  region: string | null;
  advisories: readonly Advisory[] | null;
  isShown: boolean;
};

export type { ContentAdvisoryProps };

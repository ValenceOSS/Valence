import type { ReactNode } from 'react';

type ATitleHeadProps = {
  title: string;
  ground?: string;
} & (
  | { mediaId: string; hasBackdrop: boolean; letteredBy: string | null }
  | {
      backdrop: string | null;
      lettering: string | null;
      drawn?: ReactNode;
      clip?: string | null;
      onFinding?: (finding: 'finding' | 'found' | 'none') => void;
    }
);

export type { ATitleHeadProps };

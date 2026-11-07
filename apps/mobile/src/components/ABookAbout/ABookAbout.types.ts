import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type ABookAboutProps = {
  title: string;
  author: string | null;
  overview: string | null;
  subjects?: readonly string[];
  onAsk?: (kind: MediaRequestKind, id: string) => void;
};

export type { ABookAboutProps };

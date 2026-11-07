import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

type ABookProps = {
  bookId: string;
  onRead: (bookId: string, chapterId: string | null, isFromTheStart: boolean) => void;
  onListen: () => void;
  onAskAbout?: (kind: MediaRequestKind, id: string) => void;
  onBack: () => void;
};

export type { ABookProps };

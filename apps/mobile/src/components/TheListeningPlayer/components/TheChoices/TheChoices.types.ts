import type { ListeningPanel } from '@ValenceClient/books/listeningChoices';

type TheChoicesProps = {
  panel: ListeningPanel | null;
  onClose: () => void;
};

export type { TheChoicesProps };

import type { Heard } from '@ValenceClient/books/heardLast';

type TheFloatingPlayerProps = {
  isShown: boolean;
  liftedBy: number;
  onOpen: (heard: Heard) => void;
};

export type { TheFloatingPlayerProps };

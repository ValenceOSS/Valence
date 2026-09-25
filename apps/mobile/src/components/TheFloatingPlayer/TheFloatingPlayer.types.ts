import type { Heard } from '@ValenceClient/books/heardLast';

type TheFloatingPlayerProps = {
  isShown: boolean;
  onOpen: (heard: Heard) => void;
};

export type { TheFloatingPlayerProps };

import type { Heard } from '@ValenceClient/books/heardLast';

type TheNowPlayingBarProps = {
  onOpen: (heard: Heard) => void;
};

export type { TheNowPlayingBarProps };

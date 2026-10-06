import type { Heard } from '@ValenceClient/books/heardLast';

type TheNowPlayingBarProps = {
  onOpen: (heard: Heard) => void;
  isRoomOnly?: boolean;
};

export type { TheNowPlayingBarProps };

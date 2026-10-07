import type { Direction } from '@ValenceTv/focus/Direction';

type GuideRule = {
  isRemembering: boolean;
  trapped: ReadonlySet<Direction>;
  isShut: boolean;
  lastFocused: HTMLElement | null;
};

export type { GuideRule };

import type { CSSProperties } from 'react';

type ScrollingLanding =
  | { kind: 'within'; within: number }
  | { kind: 'anchor'; anchor: string }
  | { kind: 'start' }
  | { kind: 'end' };

type ScrollingTextProps = {
  bookId: string;
  chapterId: string;
  startPart: number;
  landing: ScrollingLanding;
  lastPart: number;
  pageClassName: string;
  textStyle: CSSProperties;
  inset: number;
  onPlace: (part: number, within: number) => void;
  onFollow: (place: { part: number; anchor: string | null }) => void;
  onScroller: (scroller: HTMLDivElement | null) => void;
};

export type { ScrollingLanding, ScrollingTextProps };

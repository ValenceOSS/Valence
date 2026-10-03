import type { HighlightRect } from '@ValenceUI/useSlidingHighlight';

type HoverHighlightProps = {
  rect: HighlightRect | null;
  radius?: 'none' | 'xs' | 'sm' | 'md' | 'card' | 'nested' | 'pill';
};

export type { HoverHighlightProps };

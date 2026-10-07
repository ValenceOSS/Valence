import type { Direction } from '@ValenceTv/focus/Direction';

const nextFocusOverrides = new WeakMap<Element, Partial<Record<Direction, HTMLElement | null>>>();

export { nextFocusOverrides };

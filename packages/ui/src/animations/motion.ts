const LEAVES_FASTER = 'data-[state=closed]:duration-[var(--duration-leaving)]';

const POPUP_MOTION = [
  'origin-[var(--radix-popper-transform-origin,var(--transform-origin,center))]',
  'data-[state=open]:animate-in data-[state=closed]:animate-out',
  'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
  'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
  'duration-[var(--duration-fast)] ease-[var(--ease-out)]',
  LEAVES_FASTER,
  'motion-reduce:duration-[var(--duration-instant)]',
].join(' ');

const PRESS_MOTION = [
  'transition-[translate,scale,background-color,border-color,color,box-shadow,filter]',
  'duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover-hover:hover:scale-[1.02] active:translate-y-px active:scale-[0.98]',
  'still:transition-none still:hover:scale-100 still:active:translate-y-0 still:active:scale-100',
].join(' ');

const CARD_HOVER = { y: -6 } as const;

const CARD_PRESS = { scale: 0.985 } as const;

export { CARD_HOVER, CARD_PRESS, POPUP_MOTION, PRESS_MOTION };

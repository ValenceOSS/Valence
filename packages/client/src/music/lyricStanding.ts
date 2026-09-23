import type { LyricStanding } from './lyricStanding.types';

const BLUR_PER_LINE = 1.4;

const BLUR_MOST = 6;

/**
 * How a line of a song's words stands, given where it is against the line being sung. Before the
 * first line is sung, the first line is the one in focus, dimmed as a line still to come.
 *
 * @param index - The line.
 * @param at - The line being sung, or -1 where the words are not timed.
 * @param isSynced - Whether the words are timed at all.
 * @param isImmersive - Whether lines away from the one sung are blurred as well as dimmed.
 * @returns How visible, how large and how blurred to draw it.
 */
const lyricStanding = (
  index: number,
  at: number,
  isSynced: boolean,
  isImmersive: boolean,
): LyricStanding => {
  if (!isSynced) {
    return { opacity: 0.9, scale: 1, blur: 0 };
  }

  if (index === at) {
    return { opacity: 1, scale: 1, blur: 0 };
  }

  const away = Math.abs(index - Math.max(at, 0));

  return {
    opacity: index < at ? 0.35 : 0.6,
    scale: 0.96,
    blur: isImmersive ? Math.min(away * BLUR_PER_LINE, BLUR_MOST) : 0,
  };
};

export { lyricStanding };

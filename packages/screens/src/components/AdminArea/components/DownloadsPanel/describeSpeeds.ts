import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';

/**
 * Says how fast something is coming down and going up on one line, leaving out a direction there
 * is nothing to say about and saying nothing at all where neither is known.
 *
 * @param down - Bytes a second coming down, where known.
 * @param up - Bytes a second going up, where known.
 * @returns Such as `↓ 1.2 MB/s · ↑ 40 KB/s`, or null.
 */
const describeSpeeds = (down: number | null, up: number | null): string | null => {
  const parts = speedsOf(down, up);

  return parts.length === 0 ? null : parts.join(' · ');
};

export { describeSpeeds };

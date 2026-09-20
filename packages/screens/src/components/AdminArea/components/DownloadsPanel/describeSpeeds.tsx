import type { ReactNode } from 'react';
import { speedsOf } from '@ValenceScreens/components/AdminArea/components/DownloadsPanel/speedsOf';

/**
 * Says how fast something is coming down and going up on one line, leaving out a direction there
 * is nothing to say about and saying nothing at all where neither is known.
 *
 * @param down - Bytes a second coming down, where known.
 * @param up - Bytes a second going up, where known.
 * @returns Such as `↓ 1.2 MB/s · ↑ 40 KB/s`, with the numbers rolling, or null.
 */
const describeSpeeds = (down: number | null, up: number | null): ReactNode => {
  const [first, second] = speedsOf(down, up);

  if (first === undefined) {
    return null;
  }

  return second === undefined ? (
    first
  ) : (
    <>
      {first} · {second}
    </>
  );
};

export { describeSpeeds };

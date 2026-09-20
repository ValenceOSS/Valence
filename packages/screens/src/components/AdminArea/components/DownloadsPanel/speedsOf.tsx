import type { ReactNode } from 'react';
import { AnimatedBytes } from '@ValenceScreens/components/AnimatedBytes/AnimatedBytes';

/**
 * How fast something is coming down and going up, each on its own, leaving out a direction there is
 * nothing to say about — usenet has nothing going up.
 *
 * @param down - Bytes a second coming down, where known.
 * @param up - Bytes a second going up, where known.
 * @returns Such as `↓ 1.2 MB/s` and `↑ 40 KB/s`, each with its number rolling, or none where
 *   neither is known.
 */
const speedsOf = (down: number | null, up: number | null): ReactNode[] => [
  ...(down === null ? [] : [<AnimatedBytes key="down" bytes={down} prefix="↓ " suffix="/s" />]),
  ...(up === null ? [] : [<AnimatedBytes key="up" bytes={up} prefix="↑ " suffix="/s" />]),
];

export { speedsOf };

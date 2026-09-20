import { formatBytes } from '@ValenceCore/functions/formatBytes';

/**
 * How fast something is coming down and going up, each on its own, leaving out a direction there is
 * nothing to say about — usenet has nothing going up.
 *
 * @param down - Bytes a second coming down, where known.
 * @param up - Bytes a second going up, where known.
 * @returns Such as `['↓ 1.2 MB/s', '↑ 40 KB/s']`, or none where neither is known.
 */
const speedsOf = (down: number | null, up: number | null): string[] =>
  [
    down === null ? null : `↓ ${formatBytes(down)}/s`,
    up === null ? null : `↑ ${formatBytes(up)}/s`,
  ].filter((part) => part !== null);

export { speedsOf };

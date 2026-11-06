const SEPARATOR = /[\\/]/u;

/**
 * Two paths from the first folder they part at, so a rename shows only what changes.
 *
 * @param from - The path now.
 * @param to - The path it becomes.
 * @returns Each path from the folders they no longer share.
 */
const differingTailsOf = (from: string, to: string): { from: string; to: string } => {
  const was = from.split(SEPARATOR);
  const will = to.split(SEPARATOR);
  let shared = 0;

  while (shared < Math.min(was.length, will.length) - 1 && was[shared] === will[shared]) {
    shared += 1;
  }

  return { from: was.slice(shared).join('/'), to: will.slice(shared).join('/') };
};

export { differingTailsOf };

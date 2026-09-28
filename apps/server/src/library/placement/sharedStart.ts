/**
 * The start two names share, which is what the versions of one film or episode are told apart
 * after.
 *
 * @param left - One name.
 * @param right - The other.
 * @returns What they both start with.
 */
const sharedStart = (left: string, right: string): string => {
  let at = 0;

  while (
    at < left.length &&
    at < right.length &&
    left[at]?.toLowerCase() === right[at]?.toLowerCase()
  ) {
    at += 1;
  }

  return left.slice(0, at);
};

export { sharedStart };

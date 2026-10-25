/**
 * Whether one request asks for the page after another's: the two say exactly the same except for a
 * single number, one higher in the second, as when a definition walks `…/1/`, `…/2/`, `…/3/` of the
 * same search. A request that changes anything else — the words, as one site's second path does by
 * dropping a leading zero — is a different search, not the next page.
 *
 * @param previous - What the earlier request asked, its address and anything it posted.
 * @param next - What the later one asks.
 * @returns Whether the later one is the next page of the earlier.
 */
const isNextPage = (previous: string, next: string): boolean => {
  const before = previous.split(/(\d+)/);
  const after = next.split(/(\d+)/);

  if (before.length !== after.length) {
    return false;
  }

  const changed = before.flatMap((part, at) => (part === after[at] ? [] : [at]));
  const [only] = changed;

  return (
    changed.length === 1 &&
    only !== undefined &&
    only % 2 === 1 &&
    Number(after[only]) === Number(before[only]) + 1 &&
    after[only] === Number(after[only]).toString()
  );
};

export { isNextPage };

/**
 * The first of some things a test knows are there, failing the test where there are none.
 *
 * @param list - The things.
 * @returns The first.
 */
const firstOf = <Value>(list: readonly Value[]): Value => {
  const [first] = list;

  if (first === undefined) {
    throw new RangeError('empty');
  }

  return first;
};

export { firstOf };

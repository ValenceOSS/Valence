/**
 * Every whole number from one to another, whichever way round they are given.
 *
 * @param from - One end.
 * @param to - The other.
 * @returns The numbers, lowest first.
 */
const rangeOf = (from: number, to: number): number[] =>
  Array.from({ length: Math.abs(to - from) + 1 }, (_, index) => Math.min(from, to) + index);

export { rangeOf };

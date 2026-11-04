/**
 * Compares two values of a sort, numbers as numbers and words as words.
 *
 * @param left - One value.
 * @param right - The other.
 * @returns Negative, zero or positive, as `left` comes before, with or after `right`.
 */
const compareSorted = (left: string | number, right: string | number): number =>
  typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right));

export { compareSorted };

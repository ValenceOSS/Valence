/**
 * Picks the name a new bucket is mounted under, from what it is called: lower case, letters and
 * digits joined by dashes, and numbered where another bucket has it already. Never changed after,
 * since the libraries reading from it are kept by path.
 *
 * @param name - What the bucket is called.
 * @param taken - The names already used.
 * @returns A name of its own.
 */
const bucketIdFor = (name: string, taken: ReadonlySet<string>): string => {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/gu, '-')
      .replace(/^-+|-+$/gu, '')
      .slice(0, 40) || 'bucket';
  let id = base;
  let number = 2;

  while (taken.has(id)) {
    id = `${base}-${String(number)}`;
    number += 1;
  }

  return id;
};

export { bucketIdFor };

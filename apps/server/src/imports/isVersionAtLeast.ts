/**
 * Whether a dotted version such as `10.9.11` or `12.1.0` is at least a given major and minor.
 *
 * @param version - The version as the source reported it.
 * @param major - The major version wanted.
 * @param minor - The minor version wanted.
 * @returns Whether it is that version or later.
 */
const isVersionAtLeast = (version: string, major: number, minor: number): boolean => {
  const [first = 0, second = 0] = version
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isNaN(part) ? 0 : part));

  return first > major || (first === major && second >= minor);
};

export { isVersionAtLeast };

/**
 * Gathers name and value pairs into each name's values, in the order they came, as an object's own
 * properties only, so a parameter called `constructor` or `__proto__` is a parameter like any other
 * rather than something every object already has.
 *
 * @param pairs - The parameters, from a query string, a form body or both.
 * @returns Each name's values.
 */
const gatherParameters = (pairs: Iterable<readonly [string, string]>): Record<string, string[]> => {
  const gathered = new Map<string, string[]>();

  for (const [name, value] of pairs) {
    gathered.set(name, [...(gathered.get(name) ?? []), value]);
  }

  return Object.fromEntries(gathered);
};

export { gatherParameters };

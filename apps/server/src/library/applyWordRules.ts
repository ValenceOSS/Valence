/**
 * Lays a library's rules for one list of words over what a scan read, such as always calling
 * "Sci-Fi" "Science Fiction" or never keeping a tag: each word a rule finds, whatever its case, is
 * renamed or taken out, with no word left twice.
 *
 * @param words - The words the scan read, or nothing.
 * @param rules - The rules for this list, each what it finds and what it puts in its place, empty
 *   to take the word out.
 * @returns The words afterwards, or nothing where there were none.
 */
const applyWordRules = (
  words: readonly string[] | null | undefined,
  rules: readonly { find: string; replace: string }[],
): string[] | null => {
  if (words === null || words === undefined) {
    return null;
  }

  const renamed = words.map((word) => {
    const rule = rules.find((one) => one.find.toLocaleLowerCase() === word.toLocaleLowerCase());

    return rule === undefined ? word : rule.replace;
  });

  return renamed.filter(
    (word, at) =>
      word !== '' &&
      renamed.findIndex((other) => other.toLocaleLowerCase() === word.toLocaleLowerCase()) === at,
  );
};

export { applyWordRules };

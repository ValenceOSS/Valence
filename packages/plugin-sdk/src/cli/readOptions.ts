/**
 * Reads `--name value` pairs from the words given to the command line, leaving the positional
 * words in order.
 *
 * @param words - The arguments after the command's name.
 * @returns The options by name, and the positional words.
 */
const readOptions = (words: readonly string[]): { options: Record<string, string>; positional: string[] } => {
  const options: Record<string, string> = {};
  const positional: string[] = [];

  const rest = [...words];

  for (let word = rest.shift(); word !== undefined; word = rest.shift()) {
    if (!word.startsWith('--')) {
      positional.push(word);
    } else if (rest[0] === undefined || rest[0].startsWith('--')) {
      options[word.slice(2)] = 'true';
    } else {
      options[word.slice(2)] = rest.shift() ?? 'true';
    }
  }

  return { options, positional };
};

export { readOptions };

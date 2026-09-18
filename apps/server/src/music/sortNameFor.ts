/**
 * Where an artist sorts in a list: "The Beatles" among the Bs, the way every record shop files them.
 *
 * @param name - The artist's name.
 * @returns What to sort it by.
 */
const sortNameFor = (name: string): string => {
  const trimmed = name.trim();
  const leading = /^(the|a|an)\s+(.+)$/i.exec(trimmed);

  return (leading?.[2] ?? trimmed).toLowerCase();
};

export { sortNameFor };

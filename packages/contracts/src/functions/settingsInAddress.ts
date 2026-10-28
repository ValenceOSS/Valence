/**
 * Reads the settings a receiver needs in its message body from the address's query, where a
 * subscription that is only an address has to carry them — a Telegram chat, a Pushover user.
 *
 * @param address - The subscription's address.
 * @param names - Which settings the receiver takes.
 * @returns Each named setting the address carries, by name.
 */
const settingsInAddress = (address: string, names: readonly string[]): Record<string, string> => {
  const query = URL.parse(address)?.searchParams;

  if (query === undefined) {
    return {};
  }

  return Object.fromEntries(
    names.flatMap((name) => {
      const value = query.get(name);

      return value === null || value === '' ? [] : [[name, value]];
    }),
  );
};

export { settingsInAddress };

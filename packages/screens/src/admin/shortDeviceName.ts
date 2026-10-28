const MAKERS = new Set(['nvidia', 'geforce', 'amd', 'ati', 'intel', 'intel(r)', 'apple']);

/**
 * Shortens a graphics device's name by the maker's words it starts with, so a card reads as
 * "RTX 5080" rather than "NVIDIA GeForce RTX 5080".
 *
 * @param name - The device's name, as the media service reports it.
 * @returns The name without its maker, or the whole name where that would leave nothing.
 */
const shortDeviceName = (name: string): string => {
  const words = name.trim().split(/\s+/u);
  const firstOwn = words.findIndex((word) => !MAKERS.has(word.toLowerCase()));

  return firstOwn <= 0 ? name.trim() : words.slice(firstOwn).join(' ');
};

export { shortDeviceName };

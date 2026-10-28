/**
 * The first two letters or digits of a channel's name, for a tile to show where it has no logo — or,
 * for a name with none, its first two characters of any kind.
 *
 * @param name - What the channel is called.
 * @returns Up to two characters.
 */
const channelInitials = (name: string): string => {
  const letters = Array.from(name.replace(/[^\p{L}\p{N}]/gu, ''));

  return (letters.length > 0 ? letters : Array.from(name.replace(/\s/gu, ''))).slice(0, 2).join('');
};

export { channelInitials };

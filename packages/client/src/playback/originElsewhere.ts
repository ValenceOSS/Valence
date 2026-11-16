/**
 * The origin of an address on another server than this page's, such as a linked server a stream
 * is fetched from directly, or nothing for an address on this page's own server.
 *
 * @param address - The address, absolute or relative to the page.
 * @param here - This page's own origin.
 * @returns The other server's origin, or null.
 */
const originElsewhere = (address: string, here: string): string | null => {
  if (!URL.canParse(address, here)) {
    return null;
  }

  const { origin } = new URL(address, here);

  return origin === here ? null : origin;
};

export { originElsewhere };

const NAME = /([0-9a-f]{32})$/u;

/**
 * The name a picture is served by, from the address Valence gives it, which a Jellyfin app is
 * handed as the picture's tag and sends back to fetch it.
 *
 * @param address - Where the picture is served by name, without a width.
 * @returns The name, or nothing where there is no address.
 */
const artworkNameIn = (address: string | undefined): string | undefined =>
  address === undefined ? undefined : NAME.exec(address)?.[1];

export { artworkNameIn };

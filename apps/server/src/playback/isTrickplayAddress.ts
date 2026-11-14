const TRICKPLAY_ADDRESS = /^[0-9a-f]{32}$/u;

/**
 * Whether an id is one the transcoder names a set of thumbnails by, which is all it may be
 * asked to read one with.
 *
 * @param id - What the caller asked for.
 * @returns Whether it is a thumbnail address.
 */
const isTrickplayAddress = (id: string): boolean => TRICKPLAY_ADDRESS.test(id);

export { isTrickplayAddress };

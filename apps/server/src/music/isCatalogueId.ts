const CATALOGUE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Whether a caller's id for a record in the music catalogue is one the catalogue could have given.
 *
 * @param id - The id as it arrived.
 * @returns Whether it is a UUID.
 */
const isCatalogueId = (id: string): boolean => CATALOGUE_ID.test(id);

export { isCatalogueId };

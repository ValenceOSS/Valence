import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { CATALOGUE_IMAGES } from '@ValenceServer/images/CATALOGUE_IMAGES';

const CastSchema = z.array(
  z.object({ imageUrl: z.string().nullable().optional() }).catchall(JsonValueSchema),
);

const CATALOGUE = new URL(CATALOGUE_IMAGES);

/**
 * Whether a picture's address is one the catalogue serves, the only place this server's own cast
 * pictures come from.
 *
 * @param address - The address.
 * @returns Whether it is.
 */
const isTheCatalogues = (address: string): boolean => {
  const url = URL.parse(address);

  return (
    url !== null &&
    url.origin === CATALOGUE.origin &&
    url.pathname.startsWith(`${CATALOGUE.pathname}/`)
  );
};

/**
 * A linked server's cast list, with every picture kept only where the catalogue serves it, since
 * people's phones and browsers here fetch it as they look, and an address of the other server's
 * choosing would tell it who is looking and when.
 *
 * @param cast - The cast as the linked server sent it.
 * @returns The cast to keep, or nothing where it could not be read.
 */
const castFromTheCatalogue = (cast: Parameters<typeof CastSchema.safeParse>[0]) => {
  const read = CastSchema.safeParse(cast);

  return read.success
    ? read.data.map((member) => ({
        ...member,
        imageUrl:
          typeof member.imageUrl === 'string' && isTheCatalogues(member.imageUrl)
            ? member.imageUrl
            : null,
      }))
    : null;
};

export { castFromTheCatalogue };

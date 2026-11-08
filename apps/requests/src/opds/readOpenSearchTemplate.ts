import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  isArray: (name) => name === 'Url',
});

const DescriptionSchema = z.object({
  OpenSearchDescription: z.object({
    Url: z.array(z.object({ '@template': z.string(), '@type': z.string().optional() })),
  }),
});

/**
 * Reads the address an OpenSearch description says to search an OPDS catalogue at: the one that
 * answers in Atom, made whole against where the description was read from.
 *
 * @param xml - The description.
 * @param describedAt - Where it was read from.
 * @returns The address, with `{searchTerms}` where the words go, or nothing where it names none.
 */
const readOpenSearchTemplate = (xml: string, describedAt: string): string | null => {
  const read = DescriptionSchema.safeParse(parser.parse(xml));

  if (!read.success) {
    return null;
  }

  const atom = read.data.OpenSearchDescription.Url.find((url) =>
    (url['@type'] ?? '').startsWith('application/atom+xml'),
  );

  return atom === undefined
    ? null
    : (URL.parse(atom['@template'], describedAt)
        ?.toString()
        .replaceAll('%7B', '{')
        .replaceAll('%7D', '}') ?? null);
};

export { readOpenSearchTemplate };

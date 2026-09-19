import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';

const LISTED = new Set(['category', 'subcat', 'item', 'attr']);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  isArray: (name) => LISTED.has(name),
});

const RefusalSchema = z.object({
  error: z.union([
    z.object({ '@code': z.string().optional(), '@description': z.string().optional() }),
    z.literal('').transform(() => ({ '@code': undefined, '@description': undefined })),
  ]),
});

/**
 * Reads what a Torznab or Newznab indexer answered, turning an `<error>` it answered with into a
 * failure that says what it said.
 *
 * @param xml - What the indexer answered.
 * @returns The document, as the parser read it.
 * @throws IndexerFailure where it answered an error, or something that was not XML at all.
 */
const readIndexerXml = (xml: string): object => {
  const trimmed = xml.trim();

  if (!trimmed.startsWith('<')) {
    throw new IndexerFailure('The indexer answered something that was not Torznab or Newznab');
  }

  const document = z.looseObject({}).parse(parser.parse(trimmed));
  const refusal = RefusalSchema.safeParse(document);

  if (refusal.success) {
    const { '@code': code, '@description': description } = refusal.data.error;

    throw new IndexerFailure(
      code === '100' || code === '101' || code === '102'
        ? 'The indexer refused the API key'
        : `The indexer said: ${description ?? `error ${code ?? 'without a code'}`}`,
    );
  }

  return document;
};

export { readIndexerXml };

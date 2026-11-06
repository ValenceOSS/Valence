import { plainTextOf } from '@ValenceCore/functions/plainTextOf';

/**
 * Turns the text of an XML element into what it says: tags inside it dropped, entities spelled out
 * however many times over they were escaped, and runs of whitespace — which a machine-written
 * document is full of — made single spaces.
 *
 * @param text - The element's contents, as written.
 * @returns What a reader would see.
 */
const decodeXmlText = (text: string): string => plainTextOf(text).replace(/\s+/g, ' ').trim();

export { decodeXmlText };

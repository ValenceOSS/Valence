import type { HdrFormat } from '@ValenceContracts/schemas/ParsedRelease';

/**
 * The high dynamic range formats a release name says it carries. A name saying only HDR means
 * HDR10, which every HDR release has; HDR10+ is not also counted as HDR10, since saying so is what
 * sets it apart.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The formats, best first.
 */
const readHdr = (spaced: string): HdrFormat[] => {
  const formats: HdrFormat[] = [];
  const isPlus = /\bhdr ?10 ?(\+|plus)(?=\s|$|\W)/i.test(spaced);

  if (/\bdv\b|\bdolby ?vision\b|\bdovi\b/i.test(spaced)) {
    formats.push('dolbyVision');
  }

  if (isPlus) {
    formats.push('hdr10plus');
  }

  if (!isPlus && /\bhdr(10)?\b/i.test(spaced)) {
    formats.push('hdr10');
  }

  if (/\bhlg\b/i.test(spaced)) {
    formats.push('hlg');
  }

  return formats;
};

export { readHdr };

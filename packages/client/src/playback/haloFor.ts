const DARK = '#000000';

const LIGHT = '#ffffff';

const A_COLOUR = /^#(?<red>[0-9a-f]{2})(?<green>[0-9a-f]{2})(?<blue>[0-9a-f]{2})$/i;

const LIGHT_FROM = 0.5;

/**
 * The colour of the edge drawn round a sign's lettering so it reads over any picture: dark round
 * light lettering and light round dark, as a script's own border usually is.
 *
 * @param colour - The lettering's colour as `#rrggbb`, or nothing where it is the viewer's own.
 * @returns The edge's colour.
 */
const haloFor = (colour: string | null): string => {
  const found = colour === null ? null : A_COLOUR.exec(colour);

  if (found === null) {
    return DARK;
  }

  const channel = (hex: string | undefined): number => Number.parseInt(hex ?? '0', 16) / 255;
  const lightness =
    0.2126 * channel(found.groups?.['red']) +
    0.7152 * channel(found.groups?.['green']) +
    0.0722 * channel(found.groups?.['blue']);

  return lightness >= LIGHT_FROM ? DARK : LIGHT;
};

export { haloFor };

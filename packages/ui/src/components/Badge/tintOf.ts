/**
 * A see-through wash of a colour, for a badge tinted in a colour somebody chose rather than one of
 * its tones. A colour that is not a six-digit hex code is handed back as it is.
 *
 * @param colour - The colour, as `#rrggbb`.
 * @param opacity - How much of it shows, from none to all.
 * @returns The wash, as an `rgba()` colour.
 */
const tintOf = (colour: string, opacity: number): string => {
  const digits = colour.replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/u.test(digits)) {
    return colour;
  }

  const red = Number.parseInt(digits.slice(0, 2), 16);
  const green = Number.parseInt(digits.slice(2, 4), 16);
  const blue = Number.parseInt(digits.slice(4, 6), 16);

  return `rgba(${red.toString()}, ${green.toString()}, ${blue.toString()}, ${opacity.toString()})`;
};

export { tintOf };

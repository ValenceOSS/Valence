/**
 * Reads a number a site wrote for people rather than machines: with thousands separators of either
 * kind, a decimal comma, a unit or a word beside it. Where only one kind of separator appears once,
 * three digits after it mean thousands for a whole number and a decimal point otherwise — "1.234"
 * seeders is a thousand and more, "1.234 GB" is a little over one.
 *
 * @param text - What the site wrote.
 * @param isWhole - Whether the number is a count, which has no fractional part.
 * @returns The number, or null where there is none.
 */
const readNumber = (text: string, isWhole = false): number | null => {
  const kept = text.replace(/[^\d.,-]/g, '').replace(/(?!^)-/g, '');

  if (!/\d/.test(kept)) {
    return null;
  }

  const lastDot = kept.lastIndexOf('.');
  const lastComma = kept.lastIndexOf(',');
  let normal: string;

  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? '.' : ',';
    const thousands = decimal === '.' ? ',' : '.';

    normal = kept.replaceAll(thousands, '').replace(decimal, '.');
  } else {
    const separator = lastDot !== -1 ? '.' : lastComma !== -1 ? ',' : null;
    const count = separator === null ? 0 : kept.split(separator).length - 1;
    const after = separator === null ? '' : kept.slice(kept.lastIndexOf(separator) + 1);
    const isThousands =
      count > 1 || (isWhole && after.length === 3) || (separator === ',' && after.length === 3);

    normal =
      separator === null
        ? kept
        : isThousands
          ? kept.replaceAll(separator, '')
          : kept.replace(separator, '.');
  }

  const value = Number(normal);

  return Number.isFinite(value) ? (isWhole ? Math.trunc(value) : value) : null;
};

export { readNumber };

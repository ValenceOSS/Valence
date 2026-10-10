const BRAND = /"(?<brand>[^"]{1,64})"\s*;\s*v=/gu;

/**
 * The brands a browser names in its `Sec-CH-UA` client hint, such as "Google Chrome" and
 * "Chromium", in the order it gave them.
 *
 * @param header - The header as it arrived, where it did.
 * @returns The brands, or none where it sent no hint.
 */
const brandsOf = (header: string | null | undefined): string[] =>
  [...(header ?? '').slice(0, 512).matchAll(BRAND)].flatMap((match) =>
    match.groups?.['brand'] === undefined ? [] : [match.groups['brand']],
  );

export { brandsOf };

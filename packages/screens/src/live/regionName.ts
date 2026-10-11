const REGION_NAMES = new Intl.DisplayNames(undefined, { type: 'region' });

/**
 * A country's name in the viewer's own language, from its two-letter code.
 *
 * @param code - The code, such as `US`.
 * @returns The name, or the code where the browser has none for it.
 */
const regionName = (code: string): string => {
  try {
    return REGION_NAMES.of(code) ?? code;
  } catch {
    return code;
  }
};

export { regionName };

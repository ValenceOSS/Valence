const VIDAA_MAKER = /VIDAA\/[\d.]+\(([^;)]+);/i;

const TITAN_MAKER = /\(([A-Za-z]+), [^,()]+, (?:wired|wireless)\)/;

const HBBTV_MAKER = /HbbTV\/[\d.]+ \([^;)]*;\s*([^;)]+);/;

const SHOUTED = /^[A-Z]{4,}$/;

/**
 * Who made a television whose browser says so, for naming it as its owner would: Hisense's VIDAA
 * names its maker first among its details, Titan OS names it beside the model, and the HbbTV that
 * European sets carry names its vendor second. A name given in capitals is put in the usual case,
 * so TOSHIBA reads as Toshiba, while a short one such as JVC is left as it is.
 *
 * @param userAgent - What the browser says it is.
 * @returns The maker, or nothing where the browser does not say.
 */
const tvMakerOf = (userAgent: string): string | null => {
  const said = [VIDAA_MAKER, TITAN_MAKER, HBBTV_MAKER]
    .map((pattern) => pattern.exec(userAgent)?.[1]?.trim())
    .find((maker) => maker !== undefined && maker !== '');

  if (said === undefined) {
    return null;
  }

  return SHOUTED.test(said) ? `${said.charAt(0)}${said.slice(1).toLowerCase()}` : said;
};

export { tvMakerOf };

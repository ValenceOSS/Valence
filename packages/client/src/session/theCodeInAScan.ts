import { tidyTheCode } from '@ValenceClient/session/tidyTheCode';

const AN_ADDRESS = /^[a-z][a-z0-9+.-]*:\/\//iu;

const A_CARRIED_CODE = /[?&]user_code=([^&#]*)/u;

/**
 * Finds the code a television is waiting on in whatever a scanned QR code said.
 *
 * A television's QR code is the whole address of the page that approves it, with the code carried
 * along as `user_code`; a code on its own is taken as it is. An address that carries no code is
 * some other QR code altogether, and is nothing. Read by pattern rather than by `URL`, since React
 * Native's `URL` cannot read what an address asks.
 *
 * @param scanned - What the QR code said.
 * @returns The code as the server knows it, or null where there is none.
 */
const theCodeInAScan = (scanned: string): string | null => {
  const said = scanned.trim();
  const carried = AN_ADDRESS.test(said) ? (A_CARRIED_CODE.exec(said)?.[1] ?? '') : said;
  const code = tidyTheCode(carried);

  return code === '' ? null : code;
};

export { theCodeInAScan };

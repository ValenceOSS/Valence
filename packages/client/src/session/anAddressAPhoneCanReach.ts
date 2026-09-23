/**
 * Puts the address a television actually reached Valence on in front of the one the server thinks
 * it has.
 *
 * The server hands out an address built from its own configured base URL, and a self-hosted one is
 * very often `localhost` — correct from the server's own shell and useless on the screen of a
 * television across the room. Whatever this page was loaded from is, by demonstration, an address
 * that works on this network, and the phone being handed to is on the same one.
 *
 * The path and the code are the server's and are kept exactly; only where to send them changes.
 *
 * @param issued - The address the server issued.
 * @param origin - Where this page was loaded from.
 * @returns The address to show, or what the server said where this one cannot be read.
 */
const anAddressAPhoneCanReach = (issued: string, origin: string): string => {
  try {
    const asked = new URL(issued);
    const here = new URL(origin);

    asked.protocol = here.protocol;
    asked.hostname = here.hostname;
    asked.port = here.port;

    return asked.toString();
  } catch {
    return issued;
  }
};

export { anAddressAPhoneCanReach };

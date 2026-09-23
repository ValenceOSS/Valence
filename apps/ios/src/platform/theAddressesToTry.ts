const AN_ADDRESS_ON_THIS_NETWORK =
  /^(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|[^.\s]+\.local)(?::\d+)?$/iu;

/**
 * What somebody might have meant by the address they typed, in the order worth trying.
 *
 * Nobody types a scheme. The first thing a self-hosted application asks is where its server is, and
 * answering "valence.example" is the obvious thing to write — so an answer with no scheme is taken
 * as a question rather than a mistake, and both are tried.
 *
 * Which one first depends on what was typed. A number, a name ending in `.local`, or `localhost`
 * is a machine on this network and almost certainly has no certificate; anything else is a name
 * somebody registered, and a name somebody registered almost certainly does. Guessing wrong costs
 * one failed request, which is cheaper than asking somebody to know.
 *
 * @param typed - What they wrote.
 * @returns The whole addresses to try, best first, or nothing where they wrote nothing.
 */
const theAddressesToTry = (typed: string): string[] => {
  const said = typed.trim().replace(/\/+$/u, '');

  if (said === '') {
    return [];
  }

  if (/^https?:\/\//iu.test(said)) {
    return [said];
  }

  return AN_ADDRESS_ON_THIS_NETWORK.test(said)
    ? [`http://${said}`, `https://${said}`]
    : [`https://${said}`, `http://${said}`];
};

export { theAddressesToTry };

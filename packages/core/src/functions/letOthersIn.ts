/**
 * Waits for whatever else is waiting to run, such as a request that has come in, before carrying on.
 * Long work that never waits on anything holds up everything else the server does, even a health
 * check, until it is done; work that calls this between its steps holds it up for one step at most.
 *
 * @returns Once everything already waiting has had its turn.
 */
const letOthersIn = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

export { letOthersIn };

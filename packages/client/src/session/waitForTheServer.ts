import { isTheServerUp } from '@ValenceClient/session/isTheServerUp';

const ASK_EVERY_MS = 3000;

const ASK_FOR_MS = 120_000;

type WaitForTheServer = {
  onBack: () => void;
  onGaveUp: () => void;
};

/**
 * Asks the server whether it is up every few seconds while a player says it is reconnecting, and
 * says when it answers or after two minutes of it not answering. A server restarting for an update
 * is back well inside that, so a player waiting this long is waiting for one that is not coming.
 *
 * @param waiting - What to do once it answers, and once the asking has gone on too long.
 * @returns What stops the asking, for a player that is closed while it waits.
 */
const waitForTheServer = ({ onBack, onGaveUp }: WaitForTheServer): (() => void) => {
  const givingUpAt = Date.now() + ASK_FOR_MS;
  let isStopped = false;
  let asking: ReturnType<typeof setTimeout> | null = null;

  const askAgain = () => {
    asking = setTimeout(() => {
      void isTheServerUp().then((isUp) => {
        if (isStopped) {
          return;
        }

        if (isUp) {
          onBack();

          return;
        }

        if (Date.now() >= givingUpAt) {
          onGaveUp();

          return;
        }

        askAgain();
      });
    }, ASK_EVERY_MS);
  };

  askAgain();

  return () => {
    isStopped = true;
    clearTimeout(asking ?? undefined);
  };
};

export { waitForTheServer };

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import type { TheFirstScreenWatchProps } from './TheFirstScreenWatch.types';

const LINGERS_FOR = 700;

const WAITS_AT_MOST = 8000;

/**
 * Says when the first screen is worth showing: once it is known who is signed in, and for somebody
 * who is, once their home has something on it — never sooner than a moment, so the splash does not
 * flash past, and never later than a few seconds, so a slow server does not hold it up for good.
 *
 * @param hasServer - Whether this phone knows its server, without which there is nothing to wait for.
 * @param isHomeReady - Whether the home page has said it has something to show.
 * @param onReady - Told once, when the first screen is ready.
 */
const TheFirstScreenWatch = ({ hasServer, isHomeReady, onReady }: TheFirstScreenWatchProps) => {
  const session = useQuery({ ...sessionQueries.who(), enabled: hasServer });
  const [hasLingered, setHasLingered] = useState(false);
  const isSignedIn = session.data !== null && session.data !== undefined;
  const isKnown = !hasServer || !session.isPending;
  const isReady = hasLingered && isKnown && (!isSignedIn || isHomeReady);

  useEffect(() => {
    const lingering = setTimeout(() => {
      setHasLingered(true);
    }, LINGERS_FOR);
    const givingUp = setTimeout(onReady, WAITS_AT_MOST);

    return () => {
      clearTimeout(lingering);
      clearTimeout(givingUp);
    };
  }, [onReady]);

  useEffect(() => {
    if (isReady) {
      onReady();
    }
  }, [isReady, onReady]);

  return null;
};

TheFirstScreenWatch.displayName = 'TheFirstScreenWatch';

export { TheFirstScreenWatch };

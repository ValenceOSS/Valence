import { useCallback, useEffect, useRef, useState } from 'react';
import { useWhatIMayDo } from '@ValenceClient/session/useWhatIMayDo';
import { WelcomeTour } from '@ValenceScreens/components/WelcomeTour/WelcomeTour';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { hasSeenTour, markTourSeen } from '@ValenceScreens/tour/tourPreference';
import type { Place } from '@ValenceClient/navigation/readLocation';
import type { WelcomeTourHostProps } from './WelcomeTourHost.types';

/**
 * Decides whether the welcome tour is shown, and moves the page behind it as it goes.
 *
 * Only to somebody who is not an administrator and has not been through it on this device.
 * Administrators built the place and know their way around it; everybody else was invited to it, and
 * is shown where things are once.
 *
 * @param accountId - Who is signed in.
 * @param name - What this Valence is called.
 */
const WelcomeTourHost = ({ accountId, name }: WelcomeTourHostProps) => {
  const { mayAdminister, isLoading } = useWhatIMayDo();
  const { go } = usePlace();
  const [isDone, setIsDone] = useState(() => hasSeenTour(accountId));
  const goRef = useRef(go);

  useEffect(() => {
    goRef.current = go;
  }, [go]);

  const goTo = useCallback((section: Place['section']) => {
    goRef.current({ section });
  }, []);

  if (isLoading || mayAdminister || isDone) {
    return null;
  }

  return (
    <WelcomeTour
      isOpen
      name={name}
      onGoTo={goTo}
      onFinished={() => {
        markTourSeen(accountId);
        setIsDone(true);
      }}
    />
  );
};

WelcomeTourHost.displayName = 'WelcomeTourHost';

export { WelcomeTourHost };

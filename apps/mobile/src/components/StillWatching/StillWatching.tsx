import { useEffect, useState } from 'react';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Screen } from '@ValenceMobile/components/Screen/Screen';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { StillWatchingProps } from './StillWatching.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const A_SECOND = 1000;

/**
 * Asked instead of starting the next episode, after enough of them have followed on their own.
 *
 * Instead of, never over the top of: the next episode is not started until somebody says so, so
 * nothing is sent to a room nobody is in and nothing is marked watched that nobody saw. A phone left
 * face down on a sofa is exactly the case this is for.
 *
 * It gives up on its own when nobody answers, because nobody answering is the answer.
 *
 * @param upNext - What would play if they said yes.
 * @param secondsToAnswer - How long to wait before taking silence as a no.
 * @param onCarryOn - Told they are still there.
 * @param onStop - Told to stop, by them or by the time running out.
 */
const StillWatching = ({ upNext, secondsToAnswer, onCarryOn, onStop }: StillWatchingProps) => {
  const [left, setLeft] = useState(secondsToAnswer);

  useEffect(() => {
    const ticking = setInterval(() => {
      setLeft((was) => was - 1);
    }, A_SECOND);

    return () => {
      clearInterval(ticking);
    };
  }, []);

  useEffect(() => {
    if (left <= 0) {
      onStop();
    }
  }, [left, onStop]);

  return (
    <Screen centres>
      <Words size="title">{say('phone.stillWatching.heading')}</Words>

      <Words>{say('phone.stillWatching.upNext', { title: upNext })}</Words>

      <Words size="small" tone="muted">
        {left <= 0
          ? say('phone.stillWatching.stopping')
          : sayCount('phone.stillWatching.stoppingIn', Math.max(0, left))}
      </Words>

      <Button onPress={onCarryOn}>{say('phone.stillWatching.carryOn')}</Button>

      <Button tone="quiet" onPress={onStop}>
        {say('phone.stillWatching.stop')}
      </Button>
    </Screen>
  );
};

StillWatching.displayName = 'StillWatching';

export { StillWatching };

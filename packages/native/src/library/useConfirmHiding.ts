import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { describeHiding } from '@ValenceClient/library/describeHiding';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import type { Hiding } from '@ValenceClient/library/useHidden';
import { say } from '@ValenceI18n/say';

/**
 * Asks, in the system's own alert on a phone or a television, before something is hidden, whenever
 * something is waiting to be.
 *
 * The alert is shown once for each thing waiting to be hidden. Its answers are read as they stand
 * when one is pressed, so the page redrawing, as a download's progress does every few seconds,
 * neither shows it again nor leaves a second copy whose answer would go back a page too far.
 *
 * @param hiding - What the viewer is hiding, and the answers to give it.
 * @param onHidden - Told once something has been hidden, so a page showing it can close.
 */
const useConfirmHiding = (hiding: Hiding, onHidden?: () => void): void => {
  const faces = useQuery(profileQueries.all()).data ?? [];
  const isShared = faces.length > 1;
  const { asking } = hiding;
  const answers = useRef({ hiding, onHidden });

  useEffect(() => {
    answers.current = { hiding, onHidden };
  });

  useEffect(() => {
    if (asking === null) {
      return;
    }

    const { title, detail } = describeHiding(asking, isShared);

    Alert.alert(title, detail, [
      {
        text: say('common.keepIt'),
        style: 'cancel',
        onPress: () => {
          answers.current.hiding.dismiss();
        },
      },
      {
        text: say('common.hideIt'),
        style: 'destructive',
        onPress: () => {
          answers.current.hiding.confirm();
          answers.current.onHidden?.();
        },
      },
    ]);
  }, [asking, isShared]);
};

export { useConfirmHiding };

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { describeHiding } from '@ValenceClient/library/describeHiding';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import type { Hiding } from '@ValenceClient/library/useHidden';

/**
 * Asks, in the system's own alert, before something is hidden, whenever something is waiting to be.
 *
 * @param hiding - What the viewer is hiding, and the answers to give it.
 * @param onHidden - Told once something has been hidden, so a page showing it can close.
 */
const useConfirmHiding = (hiding: Hiding, onHidden?: () => void): void => {
  const faces = useQuery(profileQueries.all()).data ?? [];
  const isShared = faces.length > 1;
  const { asking, confirm, dismiss } = hiding;

  useEffect(() => {
    if (asking === null) {
      return;
    }

    const { title, detail } = describeHiding(asking, isShared);

    Alert.alert(title, detail, [
      { text: 'Keep it', style: 'cancel', onPress: dismiss },
      {
        text: 'Hide it',
        style: 'destructive',
        onPress: () => {
          confirm();
          onHidden?.();
        },
      },
    ]);
  }, [asking, isShared, confirm, dismiss, onHidden]);
};

export { useConfirmHiding };

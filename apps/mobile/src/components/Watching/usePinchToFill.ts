// oxlint-disable react/refs -- everything below runs during a gesture rather than during a render. How far apart two fingers started is read many times a second, nothing is drawn from it, and it must outlive the renders the gesture causes.
import { useRef, useState } from 'react';
import { PanResponder } from 'react-native';
import { howFarApart } from '@ValenceMobile/components/Watching/howFarApart';
import { theNextWayIn } from '@ValenceMobile/components/Watching/theNextWayIn';
import { theWayTheyPinched } from '@ValenceMobile/components/Watching/theWayTheyPinched';
import type { GestureResponderEvent, PanResponderInstance } from 'react-native';
import type { HowClose } from '@ValenceMobile/components/Watching/howBigToDrawIt';

type PinchedToFill = {
  howClose: HowClose;
  pinching: PanResponderInstance;
};

const isTwoFingered = (event: GestureResponderEvent): boolean =>
  event.nativeEvent.touches.length >= 2;

/**
 * Pinching a film between the two sizes it can be drawn at.
 *
 * Which somebody wants is a matter of taste and of the phone they hold, so both are a pinch away,
 * as they are in every other video on a phone.
 *
 * The gesture is claimed before anything underneath sees it, which is the whole reason this is a
 * capture. A second finger landing on a film would otherwise also read as a tap, and the controls
 * would appear every time somebody resized the picture.
 *
 * @returns How close the picture should be drawn, and the handlers to put on whatever holds it.
 */
const usePinchToFill = (): PinchedToFill => {
  const [howClose, setHowClose] = useState<HowClose>('safe');
  const startedApart = useRef<number | null>(null);

  const pinching = PanResponder.create({
    onStartShouldSetPanResponderCapture: isTwoFingered,
    onMoveShouldSetPanResponderCapture: isTwoFingered,
    onPanResponderGrant: (event) => {
      startedApart.current = howFarApart(event.nativeEvent.touches);
    },
    onPanResponderMove: (event) => {
      const began = startedApart.current;
      const nowApart = howFarApart(event.nativeEvent.touches);

      if (began === null || nowApart === null) {
        return;
      }

      const way = theWayTheyPinched(began, nowApart);

      if (way === 'neither') {
        return;
      }

      startedApart.current = nowApart;
      setHowClose(theNextWayIn(way));
    },
    onPanResponderRelease: () => {
      startedApart.current = null;
    },
    onPanResponderTerminate: () => {
      startedApart.current = null;
    },
  });

  return { howClose, pinching };
};

export type { PinchedToFill };

export { usePinchToFill };

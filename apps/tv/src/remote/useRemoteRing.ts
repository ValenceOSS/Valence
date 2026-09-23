import { useEffect, useRef } from 'react';
import { NativeModule, requireOptionalNativeModule } from 'expo';

type RingEvents = {
  onRingTurn: (turn: { degrees: number }) => void;
};

declare class ValenceRemoteRing extends NativeModule<RingEvents> {
  start(): void;
  stop(): void;
}

const ring = requireOptionalNativeModule<ValenceRemoteRing>('ValenceRemoteRing');

/**
 * Tells a listener how far somebody has turned their thumb round the Siri Remote's clickpad while
 * something wants to know — the player's scrub bar while the remote is on it — in degrees, clockwise
 * counted as forwards. Where the remote cannot report its ring, nothing is ever heard.
 *
 * @param isListening - Whether to follow the ring now.
 * @param onTurn - Told each time the thumb has turned a little further.
 */
const useRemoteRing = (isListening: boolean, onTurn: (degrees: number) => void): void => {
  const told = useRef(onTurn);

  useEffect(() => {
    told.current = onTurn;
  });

  useEffect(() => {
    if (!isListening || ring === null) {
      return;
    }

    const heard = ring.addListener('onRingTurn', ({ degrees }) => {
      told.current(degrees);
    });

    ring.start();

    return () => {
      heard.remove();
      ring.stop();
    };
  }, [isListening]);
};

export { useRemoteRing };

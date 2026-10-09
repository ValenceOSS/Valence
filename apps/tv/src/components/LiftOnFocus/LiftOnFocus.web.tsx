import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import type { LiftOnFocusProps } from './LiftOnFocus.types';

const RING_WIDTH = 3;

const RING_GAP = 2;

const RING_COLOUR = '#ffffff';

/**
 * Marks what the remote is on, for a television's browser. A card gets a white ring around its
 * picture; anything else, such as a button, grows by the given scale, from its left edge where asked.
 *
 * Nothing is animated and React draws nothing again: landing and leaving set one style on the page
 * directly. On a television the card grows and casts a shadow, but in a browser that meant drawing
 * a large blurred shadow and redrawing two cards through React on every press of the remote, which
 * an LG set felt. A ring is a border, which costs next to nothing to show.
 *
 * @param scale - How far something that is not a card grows.
 * @param shadowHeight - How tall a card's picture is, from the top, or nought for what is not a card.
 * @param cornerRadius - How rounded that picture is.
 * @param isAnchoredLeft - Whether it grows from its left edge, as a row in a list does.
 * @param style - How it is laid out.
 * @param children - What is marked.
 */
const LiftOnFocus = ({
  scale,
  shadowHeight,
  cornerRadius,
  isAnchoredLeft,
  style,
  children,
}: LiftOnFocusProps) => {
  const [element, drawn] = useDrawnElement();
  const [ring, drawnRing] = useDrawnElement();
  const isCard = shadowHeight > 0;

  useEffect(() => {
    if (element === null) {
      return;
    }

    /**
     * Shows the remote is here, or that it has gone.
     *
     * @param isHere - Whether it is here.
     */
    const mark = (isHere: boolean) => {
      if (ring !== null) {
        ring.style.opacity = isHere ? '1' : '0';

        return;
      }

      element.style.transform = isHere ? `scale(${scale.toString()})` : '';
      element.style.zIndex = isHere ? '1' : '';
    };
    const landed = () => {
      mark(true);
    };
    const left = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) {
        mark(false);
      }
    };

    element.addEventListener('focusin', landed);
    element.addEventListener('focusout', left);

    return () => {
      element.removeEventListener('focusin', landed);
      element.removeEventListener('focusout', left);
    };
  }, [element, ring, scale]);

  return (
    <View
      ref={drawn}
      style={[style, { transformOrigin: isAnchoredLeft ? 'left center' : 'center' }]}
    >
      {children}
      {isCard ? (
        <View
          ref={drawnRing}
          pointerEvents="none"
          style={[
            styles.ring,
            { height: shadowHeight + RING_GAP * 2, borderRadius: cornerRadius + RING_GAP },
          ]}
        />
      ) : null}
    </View>
  );
};

LiftOnFocus.displayName = 'LiftOnFocus';

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -RING_GAP,
    left: -RING_GAP,
    right: -RING_GAP,
    borderWidth: RING_WIDTH,
    borderColor: RING_COLOUR,
    opacity: 0,
  },
});

export { LiftOnFocus };

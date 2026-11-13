// oxlint-disable react/refs -- everything below runs during a gesture rather than during a render. Where a finger was and how far apart two started are read many times a second, nothing is drawn from them, and they must outlive the renders the gesture causes.
import { useCallback, useContext, useRef, useState } from 'react';
import { SHEET_HOLD } from '@ValenceMobile/components/ASheet/SHEET_HOLD';
import { PanResponder, StyleSheet, View } from 'react-native';
import { ATonedPicture } from '@ValenceMobile/components/ATonedPicture/ATonedPicture';
import { howFarApart } from '@ValenceMobile/components/Watching/howFarApart';
import { movedFrame } from '@ValenceCore/pictures/movedFrame';
import { framedPlacement } from '@ValenceMobile/pictures/framedPlacement';
import { zoomedFrame } from '@ValenceCore/pictures/zoomedFrame';
import { MOST_FRAME_ZOOM } from '@ValenceContracts/constants/MOST_FRAME_ZOOM';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { AFramerProps } from './AFramer.types';
import { say } from '@ValenceI18n/say';

const ZOOM_STEP = 1.25;

const SOFT_CORNERS = 0.06;

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  whole: { height: '100%', width: '100%' },
});

/**
 * A picture to be placed in its shape by hand: dragged with one finger to choose which part shows,
 * and pinched with two to draw it nearer or further. A screen reader can draw it nearer or further
 * by swiping up and down on it.
 *
 * @param uri - Where the picture is.
 * @param frame - Where it sits now.
 * @param aspect - How wide its shape is for its height.
 * @param tone - The filter it is drawn in.
 * @param width - How wide it is drawn.
 * @param roundness - How round its corners are, as a share of its width: a half is a circle.
 * @param onFrame - Told where it sits each time it moves.
 */
const AFramer = ({
  uri,
  frame,
  aspect,
  tone = null,
  width,
  roundness = SOFT_CORNERS,
  onFrame,
}: AFramerProps) => {
  const colours = useTheColours();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const measure = useCallback((measured: { width: number; height: number }) => {
    if (measured.width > 0 && measured.height > 0) {
      setSize((was) =>
        was?.width === measured.width && was.height === measured.height ? was : measured,
      );
    }
  }, []);
  const latest = useRef(frame);
  const last = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<{ apart: number; zoom: number } | null>(null);
  const height = width / aspect;

  latest.current = frame;

  const place = (next: PhotoFrame) => {
    latest.current = next;
    onFrame(next);
  };

  const zoomTo = (zoom: number) => {
    if (size !== null) {
      place(zoomedFrame(latest.current, zoom, size, aspect, MOST_FRAME_ZOOM));
    }
  };

  const holdSheet = useContext(SHEET_HOLD);
  const dragging = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      const [touch] = event.nativeEvent.touches;

      holdSheet?.(true);

      last.current = touch === undefined ? null : { x: touch.pageX, y: touch.pageY };
      pinch.current = null;
    },
    onPanResponderMove: (event) => {
      const { touches } = event.nativeEvent;
      const apart = howFarApart(touches);

      if (size === null) {
        return;
      }

      if (apart !== null) {
        pinch.current ??= { apart, zoom: latest.current.zoom };
        zoomTo(pinch.current.zoom * (apart / pinch.current.apart));
        last.current = null;

        return;
      }

      const [touch] = touches;

      if (touch === undefined) {
        return;
      }

      const was = last.current;

      last.current = { x: touch.pageX, y: touch.pageY };
      pinch.current = null;

      if (was !== null) {
        place(
          movedFrame(
            latest.current,
            { x: (touch.pageX - was.x) / width, y: (touch.pageY - was.y) / height },
            size,
            aspect,
          ),
        );
      }
    },
    onPanResponderRelease: () => {
      last.current = null;
      pinch.current = null;
      holdSheet?.(false);
    },
    onPanResponderTerminate: () => {
      last.current = null;
      pinch.current = null;
      holdSheet?.(false);
    },
  });

  const placed = size === null ? null : framedPlacement(size, aspect, frame, { width, height });

  return (
    <View
      {...dragging.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={say('common.wherePictureSits')}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        zoomTo(
          latest.current.zoom *
            (event.nativeEvent.actionName === 'increment' ? ZOOM_STEP : 1 / ZOOM_STEP),
        );
      }}
      style={[
        styles.box,
        {
          width,
          height,
          backgroundColor: colours.surfaceRaised,
          borderRadius: width * roundness,
          borderCurve: 'continuous',
        },
      ]}
    >
      <View style={placed ?? styles.whole}>
        <ATonedPicture uri={uri} tone={tone} style={styles.whole} onLoad={measure} />
      </View>
    </View>
  );
};

AFramer.displayName = 'AFramer';

export { AFramer };

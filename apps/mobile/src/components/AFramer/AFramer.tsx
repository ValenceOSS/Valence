// oxlint-disable react/refs -- everything below runs during a gesture rather than during a render. Where a finger was and how far apart two started are read many times a second, nothing is drawn from them, and they must outlive the renders the gesture causes.
import { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { howFarApart } from '@ValenceMobile/components/Watching/howFarApart';
import { movedFrame } from '@ValenceCore/pictures/movedFrame';
import { placedPicture } from '@ValenceCore/pictures/placedPicture';
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
 * @param width - How wide it is drawn.
 * @param roundness - How round its corners are, as a share of its width: a half is a circle.
 * @param onFrame - Told where it sits each time it moves.
 */
const AFramer = ({
  uri,
  frame,
  aspect,
  width,
  roundness = SOFT_CORNERS,
  onFrame,
}: AFramerProps) => {
  const colours = useTheColours();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
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

  const dragging = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      const [touch] = event.nativeEvent.touches;

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
    },
    onPanResponderTerminate: () => {
      last.current = null;
      pinch.current = null;
    },
  });

  const at = size === null ? null : placedPicture(size, aspect, frame);

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
      <View
        style={
          at === null
            ? styles.whole
            : {
                position: 'absolute',
                left: at.left * width,
                top: at.top * height,
                width: at.width * width,
                height: at.height * height,
              }
        }
      >
        <ARemotePicture
          uri={uri}
          style={styles.whole}
          onLoad={(measured) => {
            if (measured.width > 0 && measured.height > 0) {
              setSize(measured);
            }
          }}
        />
      </View>
    </View>
  );
};

AFramer.displayName = 'AFramer';

export { AFramer };

import { useEffect, useMemo, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Picture, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { SKETCH_SPACE } from '@ValenceContracts/schemas/SketchScene';
import { STROKE_LOOKS } from '@ValenceClient/sketch/STROKE_LOOKS';
import { itemAt } from '@ValenceClient/sketch/itemAt';
import { drawSketchScene } from '@ValenceMobile/sketch/drawSketchScene';
import type { GestureResponderEvent } from 'react-native';
import type { SkPath } from '@shopify/react-native-skia';
import type { SketchScene, SketchStroke } from '@ValenceContracts/schemas/SketchScene';
import type { ASketchPadProps } from './ASketchPad.types';
import { say } from '@ValenceI18n/say';

const MOST_POINTS = 4000;

const styles = StyleSheet.create({
  pad: { borderRadius: 24, overflow: 'hidden' },
});

/**
 * Where a touch lands on the board, in points across and down it, and how hard it pressed where the
 * phone can tell.
 *
 * @param event - The touch.
 * @returns The place and the pressure.
 */
const touchOf = (event: GestureResponderEvent): [number, number, number] => {
  const { locationX, locationY, force } = event.nativeEvent;

  return [locationX, locationY, force === undefined || force === 0 ? 0.6 : Math.min(force, 1)];
};

/**
 * Records a sketch as a picture the size of the board.
 *
 * @param scene - The sketch.
 * @param side - How wide the board is, in points.
 * @returns The picture.
 */
const recorded = (scene: SketchScene, side: number) => {
  const recorder = Skia.PictureRecorder();

  drawSketchScene(recorder.beginRecording(Skia.XYWHRect(0, 0, side, side)), scene, side);

  return recorder.finishRecordingAsPicture();
};

/**
 * The board a sketch is drawn on, drawn with Skia exactly as it is saved: a finger lays down a stroke
 * with the chosen tool, ink and size, or, with the move tool, drags a piece of text or a sticker
 * around.
 *
 * What a finger is doing moves on the UI thread rather than through React: the stroke being drawn is
 * a path held in a shared value, and a piece being dragged is drawn on its own and slid by a shared
 * offset. The sketch is recorded again only when a stroke or a drag ends, since recording a picture
 * on every movement let the JavaScript collector free one the screen was still drawing.
 *
 * @param scene - The sketch.
 * @param onChange - Told the sketch once a stroke or a move is finished.
 * @param tool - What a finger does.
 * @param ink - The colour a stroke is drawn in.
 * @param size - How thick a stroke is, in the sketch's units.
 * @param side - How wide and high the board is drawn, in points.
 */
const ASketchPad = ({ scene, onChange, tool, ink, size, side }: ASketchPadProps) => {
  const [moving, setMoving] = useState<number | null>(null);
  const [latest] = useState(
    () =>
      new Map<
        'now',
        {
          scene: SketchScene;
          tool: ASketchPadProps['tool'];
          ink: string;
          size: number;
          side: number;
          onChange: (scene: SketchScene) => void;
        }
      >(),
  );
  const [held] = useState(
    () =>
      new Map<
        'now',
        { points: [number, number, number][]; moving: number | null; from: [number, number] }
      >([['now', { points: [], moving: null, from: [0, 0] }]]),
  );
  const path = useSharedValue<SkPath>(Skia.Path.Make());
  const offset = useSharedValue({ x: 0, y: 0 });
  const slid = useDerivedValue(() => [
    { translateX: offset.get().x },
    { translateY: offset.get().y },
  ]);

  useEffect(() => {
    latest.set('now', { scene, tool, ink, size, side, onChange });
  });

  const base = useMemo(
    () =>
      recorded(
        moving === null ? scene : { ...scene, items: scene.items.filter((_, at) => at !== moving) },
        side,
      ),
    [scene, moving, side],
  );
  const lifted = useMemo(() => {
    const item = moving === null ? undefined : scene.items[moving];

    return item === undefined ? null : recorded({ background: '#00000000', items: [item] }, side);
  }, [scene, moving, side]);

  const look = STROKE_LOOKS[tool === 'move' ? 'pen' : tool];
  const scale = side / SKETCH_SPACE;

  const [responder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const now = latest.get('now');
        const gesture = held.get('now');

        if (now === undefined || gesture === undefined) {
          return;
        }
        const [x, y, pressure] = touchOf(event);

        if (now.tool === 'move') {
          const found = itemAt(
            now.scene,
            x / (now.side / SKETCH_SPACE),
            y / (now.side / SKETCH_SPACE),
          );

          gesture.moving = found;
          gesture.from = [x, y];
          offset.set({ x: 0, y: 0 });
          setMoving(found);

          return;
        }

        const started = Skia.Path.Make();

        started.moveTo(x, y);
        started.lineTo(x + 0.01, y);
        gesture.points = [[x, y, pressure]];
        path.set(started);
      },
      onPanResponderMove: (event) => {
        const now = latest.get('now');
        const gesture = held.get('now');

        if (now === undefined || gesture === undefined) {
          return;
        }
        const [x, y, pressure] = touchOf(event);

        if (now.tool === 'move') {
          if (gesture.moving !== null) {
            offset.set({ x: x - gesture.from[0], y: y - gesture.from[1] });
          }

          return;
        }

        if (gesture.points.length >= MOST_POINTS) {
          return;
        }

        gesture.points.push([x, y, pressure]);

        const grown = path.get().copy();

        grown.lineTo(x, y);
        path.set(grown);
      },
      onPanResponderRelease: () => {
        const now = latest.get('now');
        const gesture = held.get('now');

        if (now === undefined || gesture === undefined) {
          return;
        }
        const toSketch = SKETCH_SPACE / now.side;

        if (now.tool === 'move') {
          const at = gesture.moving;

          if (at !== null) {
            const dx = offset.get().x * toSketch;
            const dy = offset.get().y * toSketch;

            now.onChange({
              ...now.scene,
              items: now.scene.items.map((item, index) =>
                index === at && item.kind !== 'stroke'
                  ? { ...item, x: Math.round(item.x + dx), y: Math.round(item.y + dy) }
                  : item,
              ),
            });
          }

          gesture.moving = null;
          offset.set({ x: 0, y: 0 });
          setMoving(null);

          return;
        }

        if (gesture.points.length > 0) {
          const stroke: SketchStroke = {
            kind: 'stroke',
            tool: now.tool,
            colour: now.ink,
            size: now.size,
            points: gesture.points.map(([x, y, pressure]) => [
              Math.round(x * toSketch),
              Math.round(y * toSketch),
              pressure,
            ]),
          };

          now.onChange({ ...now.scene, items: [...now.scene.items, stroke] });
        }

        gesture.points = [];
        path.set(Skia.Path.Make());
      },
    }),
  );

  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="image"
      accessibilityLabel={say('screens.faceEditor.sketchStudio.yourDrawing')}
      style={[styles.pad, { height: side, width: side }]}
    >
      <Canvas style={{ height: side, width: side }}>
        <Picture picture={base} />
        {lifted === null ? null : (
          <Group transform={slid}>
            <Picture picture={lifted} />
          </Group>
        )}
        <Path
          path={path}
          color={tool === 'eraser' ? scene.background : ink}
          opacity={look.alpha}
          style="stroke"
          strokeWidth={size * look.thickness * scale}
          strokeCap={look.cap}
          strokeJoin="round"
        />
      </Canvas>
    </View>
  );
};

ASketchPad.displayName = 'ASketchPad';

export { ASketchPad };

import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RotateCcw, RotateCw, TypeOutline, X } from '@keyline-icons/react-native';
import { SKETCH_SPACE } from '@ValenceContracts/schemas/SketchScene';
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { STICKERS } from '@ValenceClient/sketch/STICKERS';
import { AColourSwatches } from '@ValenceMobile/components/AColourSwatches/AColourSwatches';
import { ASettingSlider } from '@ValenceMobile/components/AFaceEditor/components/ASettingSlider/ASettingSlider';
import { ASketchPad } from '@ValenceMobile/components/ASketchPad/ASketchPad';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { TextField } from '@ValenceMobile/components/TextField/TextField';
import { Words } from '@ValenceMobile/components/Words/Words';
import { SKETCH_TOOLS } from './SKETCH_TOOLS';
import type { ASketchTool } from '@ValenceMobile/components/ASketchPad/ASketchPad.types';
import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';
import type { ASketchStudioProps } from './ASketchStudio.types';
import { say } from '@ValenceI18n/say';

const CENTRE = SKETCH_SPACE / 2;

const STICKER_SIZE = 220;

const WORDS_SIZE = 160;

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  board: { alignItems: 'center' },
  section: { gap: 12 },
  sticker: { fontSize: 28 },
  stickers: { gap: 6 },
  words: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  wordsField: { flex: 1 },
});

/**
 * The drawing studio: the board, then the tool a finger draws with, the ink and how thick it is,
 * the background, stickers and text to place, and undo, redo and starting again.
 *
 * @param scene - The drawing.
 * @param onChange - Told the drawing as it now is.
 * @param side - How wide the board is drawn, in points.
 */
const ASketchStudio = ({ scene, onChange, side }: ASketchStudioProps) => {
  const [tool, setTool] = useState<ASketchTool>('pen');
  const [ink, setInk] = useState<string>(PROFILE_COLOURS[17]);
  const [size, setSize] = useState(24);
  const [words, setWords] = useState('');
  const [undone, setUndone] = useState<readonly SketchScene[]>([]);
  const [history, setHistory] = useState<readonly SketchScene[]>([]);

  const change = (next: SketchScene) => {
    setHistory((was) => [...was, scene]);
    setUndone([]);
    onChange(next);
  };

  const place = (item: SketchScene['items'][number]) => {
    change({ ...scene, items: [...scene.items, item] });
    setTool('move');
  };

  return (
    <View style={styles.section}>
      <View style={styles.board}>
        <ASketchPad scene={scene} onChange={change} tool={tool} ink={ink} size={size} side={side} />
      </View>

      <Words size="small" tone="muted">
        {say('screens.faceEditor.sketchStudio.drawOnTheBoardAddWords')}
      </Words>

      <SegmentedRow
        label={say('screens.faceEditor.kindOfFace')}
        items={SKETCH_TOOLS}
        value={tool}
        onSelect={(chosen) => {
          setTool(SKETCH_TOOLS.find((one) => one.id === chosen)?.id ?? 'pen');
        }}
      />

      <View style={styles.actions}>
        <Button
          tone="ghost"
          icon={RotateCcw}
          isDisabled={history.length === 0}
          onPress={() => {
            const before = history.at(-1);

            if (before !== undefined) {
              setHistory((was) => was.slice(0, -1));
              setUndone((was) => [...was, scene]);
              onChange(before);
            }
          }}
        >
          {say('screens.faceEditor.sketchStudio.undo')}
        </Button>
        <Button
          tone="ghost"
          icon={RotateCw}
          isDisabled={undone.length === 0}
          onPress={() => {
            const after = undone.at(-1);

            if (after !== undefined) {
              setUndone((was) => was.slice(0, -1));
              setHistory((was) => [...was, scene]);
              onChange(after);
            }
          }}
        >
          {say('screens.faceEditor.sketchStudio.redo')}
        </Button>
        <Button
          tone="ghost"
          icon={X}
          isDestructive
          isDisabled={scene.items.length === 0}
          onPress={() => {
            change({ ...scene, items: [] });
          }}
        >
          {say('common.startAgain')}
        </Button>
      </View>

      <Words size="small" tone="muted">
        {say('common.ink')}
      </Words>
      <AColourSwatches value={ink} options={PROFILE_COLOURS} onChoose={setInk} />
      <ASettingSlider label={say('common.size')} value={size} min={4} max={120} onChange={setSize} />

      <Words size="small" tone="muted">
        {say('common.background')}
      </Words>
      <AColourSwatches
        value={scene.background}
        options={PROFILE_COLOURS}
        onChoose={(background) => {
          change({ ...scene, background });
        }}
      />

      <Words size="small" tone="muted">
        {say('screens.faceEditor.sketchStudio.addASticker')}
      </Words>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickers}>
        {STICKERS.map((sticker) => (
          <Button
            key={sticker}
            tone="bare"
            label={say('screens.faceEditor.sketchStudio.addSticker', { sticker })}
            onPress={() => {
              place({ kind: 'sticker', sticker, x: CENTRE, y: CENTRE, size: STICKER_SIZE, turn: 0 });
            }}
          >
            <Text style={styles.sticker}>{sticker}</Text>
          </Button>
        ))}
      </ScrollView>

      <View style={styles.words}>
        <View style={styles.wordsField}>
          <TextField
            label={say('screens.faceEditor.sketchStudio.wordsToAdd')}
            value={words}
            onValueChange={setWords}
            placeholder={say('screens.faceEditor.sketchStudio.saySomething')}
          />
        </View>
        <Button
          tone="quiet"
          icon={TypeOutline}
          isDisabled={words.trim() === ''}
          onPress={() => {
            place({
              kind: 'text',
              text: words.trim().slice(0, 40),
              font: 'gilroy',
              colour: ink,
              x: CENTRE,
              y: CENTRE,
              size: WORDS_SIZE,
              turn: 0,
            });
            setWords('');
          }}
        >
          {say('screens.faceEditor.sketchStudio.addWords')}
        </Button>
      </View>
    </View>
  );
};

ASketchStudio.displayName = 'ASketchStudio';

export { ASketchStudio };

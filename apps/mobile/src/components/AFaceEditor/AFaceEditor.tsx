import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { FACE_MODES } from '@ValenceClient/profiles/FACE_MODES';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { ADrawnStudio } from '@ValenceMobile/components/AFaceEditor/components/ADrawnStudio/ADrawnStudio';
import { ALetterStudio } from '@ValenceMobile/components/AFaceEditor/components/ALetterStudio/ALetterStudio';
import { APhotoStudio } from '@ValenceMobile/components/AFaceEditor/components/APhotoStudio/APhotoStudio';
import { ASketchStudio } from '@ValenceMobile/components/AFaceEditor/components/ASketchStudio/ASketchStudio';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { aPictureFile } from '@ValenceMobile/platform/aPictureFile';
import { drawPicture } from '@ValenceMobile/platform/drawPicture';
import { drawSketchScene } from '@ValenceMobile/sketch/drawSketchScene';
import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';
import type { AFaceEditorProps } from './AFaceEditor.types';
import { say } from '@ValenceI18n/say';

const PREVIEW = 180;

const SAVED_ACROSS = 512;

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

const styles = StyleSheet.create({
  editor: { gap: 18 },
  preview: { alignItems: 'center', minHeight: PREVIEW },
});

type Mode = (typeof FACE_MODES)[number]['id'];

/**
 * The profile picture editor, as the web's: a photo, a drawing, an avatar or a letter, with a live
 * preview above the chosen studio. A drawing is saved as a picture the server keeps,
 * so every client shows it the same way. Nothing is changed until Use this picture is pressed.
 *
 * @param isOpen - Whether the editor is out.
 * @param profile - The profile whose picture is being changed, as it stands in the draft.
 * @param onClose - Told to put the editor away without changing anything.
 * @param onUse - Told the picture chosen, its colour, and any file to send with it.
 */
const AFaceEditor = ({ isOpen, profile, onClose, onUse }: AFaceEditorProps) => {
  const { width } = useWindowDimensions();
  const start = profile.avatar;
  const [mode, setMode] = useState<Mode>(start.kind === 'orb' ? 'photo' : start.kind);
  const [colour, setColour] = useState<ProfileColour>(profile.colour);
  const [font, setFont] = useState<LetterFont>(start.kind === 'initial' ? start.font : 'gilroy');
  const [drawn, setDrawn] = useState(
    start.kind === 'drawn'
      ? { style: start.style, seed: start.seed }
      : { style: 'funEmoji' as const, seed: profile.id },
  );
  const [picked, setPicked] = useState<{ uri: string; isVideo: boolean } | null>(null);
  const [frame, setFrame] = useState<PhotoFrame>(
    start.kind === 'photo' ? (start.frame ?? UNFRAMED) : UNFRAMED,
  );
  const [scene, setScene] = useState<SketchScene>(
    start.kind === 'sketch' ? start.scene : { background: profile.colour, items: [] },
  );
  const [isUsing, setIsUsing] = useState(false);
  const board = Math.min(width - 48, 360);
  const hadPhoto = start.kind === 'photo';

  const avatar: Avatar =
    mode === 'initial'
      ? { kind: 'initial', font }
      : mode === 'drawn'
        ? { kind: 'drawn', style: drawn.style, seed: drawn.seed }
        : mode === 'photo'
          ? {
              kind: 'photo',
              isVideo: picked === null ? hadPhoto && start.isVideo : picked.isVideo,
              frame,
            }
          : { kind: 'sketch', scene };

  const canUse = mode !== 'photo' || picked !== null || hadPhoto;

  const use = async () => {
    setIsUsing(true);

    const image =
      mode === 'sketch'
        ? drawPicture(SAVED_ACROSS, (canvas) => {
            drawSketchScene(canvas, scene, SAVED_ACROSS);
          })
        : null;
    const file =
      image !== null
        ? await aPictureFile(image, 'profile-picture')
        : mode === 'photo'
          ? (picked?.uri ?? null)
          : null;

    setIsUsing(false);
    onUse({ avatar, colour, file });
  };

  return (
    <ASheet
      isOpen={isOpen}
      title={say('screens.faceEditor.yourFace')}
      onClose={onClose}
      footer={
        <Button
          isBusy={isUsing}
          isDisabled={!canUse}
          onPress={() => {
            void use();
          }}
        >
          {say('screens.faceEditor.useThisFace')}
        </Button>
      }
    >
      <View style={styles.editor}>
        {mode === 'sketch' ? null : (
          <View style={styles.preview}>
            <AFace
              profile={{ ...profile, colour, avatar }}
              picked={mode === 'photo' && picked !== null && !picked.isVideo ? picked.uri : null}
              isLarge
            />
          </View>
        )}

        <SegmentedRow
          label={say('screens.faceEditor.kindOfFace')}
          items={FACE_MODES}
          value={mode}
          onSelect={(chosen) => {
            setMode(FACE_MODES.find((one) => one.id === chosen)?.id ?? 'initial');
          }}
        />

        {mode === 'initial' ? (
          <ALetterStudio
            name={profile.name}
            font={font}
            colour={colour}
            onFont={setFont}
            onColour={setColour}
          />
        ) : mode === 'drawn' ? (
          <ADrawnStudio
            style={drawn.style}
            seed={drawn.seed}
            colour={colour}
            onChange={setDrawn}
            onColour={setColour}
          />
        ) : mode === 'photo' ? (
          <APhotoStudio frame={frame} onPick={setPicked} onFrame={setFrame} />
        ) : (
          <ASketchStudio scene={scene} onChange={setScene} side={board} />
        )}
      </View>
    </ASheet>
  );
};

AFaceEditor.displayName = 'AFaceEditor';

export { AFaceEditor };

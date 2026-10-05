import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FACE_MODES } from '@ValenceClient/profiles/FACE_MODES';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { ADrawnStudio } from '@ValenceMobile/components/AFaceEditor/components/ADrawnStudio/ADrawnStudio';
import { ALetterStudio } from '@ValenceMobile/components/AFaceEditor/components/ALetterStudio/ALetterStudio';
import { APhotoStudio } from '@ValenceMobile/components/AFaceEditor/components/APhotoStudio/APhotoStudio';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { AFaceEditorProps } from './AFaceEditor.types';
import { say } from '@ValenceI18n/say';

const PREVIEW = 180;

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

const styles = StyleSheet.create({
  editor: { gap: 18 },
  preview: { alignItems: 'center', minHeight: PREVIEW },
});

type Mode = (typeof FACE_MODES)[number]['id'];

/**
 * The profile picture editor, as the web's: a photo, an avatar or a letter, with a live preview
 * above the chosen studio. A face that can no longer be made — an orb or a drawing — opens on the
 * photo studio. Nothing is changed until Use this picture is pressed.
 *
 * @param isOpen - Whether the editor is out.
 * @param profile - The profile whose picture is being changed, as it stands in the draft.
 * @param onClose - Told to put the editor away without changing anything.
 * @param onUse - Told the picture chosen, its colour, and any file to send with it.
 */
const AFaceEditor = ({ isOpen, profile, onClose, onUse }: AFaceEditorProps) => {
  const start = profile.avatar;
  const [mode, setMode] = useState<Mode>(
    start.kind === 'orb' || start.kind === 'sketch' ? 'photo' : start.kind,
  );
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
  const hadPhoto = start.kind === 'photo';

  const avatar: Avatar =
    mode === 'initial'
      ? { kind: 'initial', font }
      : mode === 'drawn'
        ? { kind: 'drawn', style: drawn.style, seed: drawn.seed }
        : {
            kind: 'photo',
            isVideo: picked === null ? hadPhoto && start.isVideo : picked.isVideo,
            frame,
          };

  const canUse = mode !== 'photo' || picked !== null || hadPhoto;

  return (
    <ASheet
      isOpen={isOpen}
      title={say('screens.faceEditor.yourFace')}
      onClose={onClose}
      footer={
        <Button
          isDisabled={!canUse}
          onPress={() => {
            onUse({ avatar, colour, file: mode === 'photo' ? (picked?.uri ?? null) : null });
          }}
        >
          {say('screens.faceEditor.useThisFace')}
        </Button>
      }
    >
      <View style={styles.editor}>
        <View style={styles.preview}>
          <AFace
            profile={{ ...profile, colour, avatar }}
            picked={mode === 'photo' && picked !== null && !picked.isVideo ? picked.uri : null}
            isLarge
          />
        </View>

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
        ) : (
          <APhotoStudio frame={frame} onPick={setPicked} onFrame={setFrame} />
        )}
      </View>
    </ASheet>
  );
};

AFaceEditor.displayName = 'AFaceEditor';

export { AFaceEditor };

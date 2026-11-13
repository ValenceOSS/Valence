import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FACE_MODES } from '@ValenceClient/profiles/FACE_MODES';
import { AFace } from '@ValenceMobile/components/AFace/AFace';
import { AFramer } from '@ValenceMobile/components/AFramer/AFramer';
import { thePictureFor } from '@ValenceMobile/components/AFace/thePictureFor';
import { FACE_ROUNDNESS } from '@ValenceMobile/components/AFace/FACE_ROUNDNESS';
import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';
import { ADrawnStudio } from '@ValenceMobile/components/AFaceEditor/components/ADrawnStudio/ADrawnStudio';
import { ALetterStudio } from '@ValenceMobile/components/AFaceEditor/components/ALetterStudio/ALetterStudio';
import { APhotoStudio } from '@ValenceMobile/components/AFaceEditor/components/APhotoStudio/APhotoStudio';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import type {
  Avatar,
  PhotoFilter,
  PhotoFrame,
  ProfileColour,
} from '@ValenceContracts/schemas/ViewerProfile';
import { toneOfFilter } from '@ValenceContracts/functions/toneOfFilter';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { AFaceEditorProps } from './AFaceEditor.types';
import { say } from '@ValenceI18n/say';

const PREVIEW = 180;

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

const STAGE = PREVIEW + 28;

const BAND = 232;

const styles = StyleSheet.create({
  band: { height: BAND, justifyContent: 'center' },
  editor: { gap: 16 },
  stage: { alignItems: 'center', gap: 8, height: STAGE, justifyContent: 'center' },
});

type Mode = (typeof FACE_MODES)[number]['id'];

/**
 * The profile picture editor, laid out as the web's: which kind of face along the top, the face
 * itself as it changes, and beneath it a band of the chosen kind's choices that is the same height
 * whichever kind is chosen, so the sheet does not jump. A face this editor does not make — an orb or
 * a drawing — opens on the photo studio. Nothing is changed until Use this picture is pressed.
 *
 * @param isOpen - Whether the editor is out.
 * @param profile - The profile whose picture is being changed, as it stands in the draft.
 * @param onClose - Told to put the editor away without changing anything.
 * @param onUse - Told the picture chosen, its colour, and any file to send with it.
 */
const AFaceEditor = ({ isOpen, profile, onClose, onUse }: AFaceEditorProps) => {
  const start = profile.avatar;
  const [mode, setMode] = useState<Mode>('photo');
  const [colour, setColour] = useState<ProfileColour>(profile.colour);
  const [font, setFont] = useState<LetterFont>(
    start.kind === 'initial' ? start.font : PLUS_JAKARTA_SANS_AS_STORED,
  );
  const [drawn, setDrawn] = useState(
    start.kind === 'drawn'
      ? { style: start.style, seed: start.seed }
      : { style: 'funEmoji' as const, seed: profile.id },
  );
  const [isOnColour, setIsOnColour] = useState(start.kind === 'drawn' && start.isOnColour === true);
  const [colourTo, setColourTo] = useState(
    start.kind === 'initial' ? (start.colourTo ?? null) : null,
  );
  const [picked, setPicked] = useState<{ uri: string; isVideo: boolean } | null>(null);
  const [filter, setFilter] = useState<PhotoFilter>(
    start.kind === 'photo' ? (start.filter ?? 'original') : 'original',
  );
  const [frame, setFrame] = useState<PhotoFrame>(
    start.kind === 'photo' ? (start.frame ?? UNFRAMED) : UNFRAMED,
  );
  const hadPhoto = start.kind === 'photo';

  const avatar: Avatar =
    mode === 'initial'
      ? { kind: 'initial', font, ...(colourTo === null ? {} : { colourTo }) }
      : mode === 'drawn'
        ? {
            kind: 'drawn',
            style: drawn.style,
            seed: drawn.seed,
            ...(isOnColour ? { isOnColour: true } : {}),
          }
        : {
            kind: 'photo',
            isVideo: picked === null ? hadPhoto && start.isVideo : picked.isVideo,
            frame,
            hasFramedPicture: false,
            filter,
          };

  const canUse = mode !== 'photo' || picked !== null || hadPhoto;
  const whole = thePictureFor({ ...profile, avatar });
  const framing =
    mode !== 'photo' || picked?.isVideo === true || avatar.kind !== 'photo' || avatar.isVideo
      ? null
      : (picked?.uri ?? (hadPhoto ? (whole?.uri ?? null) : null));

  return (
    <ASheet
      isOpen={isOpen}
      title={say('screens.faceEditor.yourFace')}
      isSteady
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
        <SegmentedRow
          label={say('screens.faceEditor.kindOfFace')}
          items={FACE_MODES}
          value={mode}
          fills
          onSelect={(chosen) => {
            setMode(FACE_MODES.find((one) => one.id === chosen)?.id ?? 'initial');
          }}
        />

        <View style={styles.stage}>
          {framing === null ? (
            <AFace
              profile={{ ...profile, colour, avatar }}
              picked={mode === 'photo' && picked !== null && !picked.isVideo ? picked.uri : null}
              side={PREVIEW}
            />
          ) : (
            <>
              <AFramer
                uri={framing}
                frame={frame}
                aspect={PICTURE_ASPECTS.face}
                width={PREVIEW}
                roundness={FACE_ROUNDNESS}
                tone={toneOfFilter(filter)}
                onFrame={setFrame}
              />
              <Words size="small" tone="muted">
                {say('common.dragToMovePinchToZoom')}
              </Words>
            </>
          )}
        </View>

        <View style={styles.band}>
          {mode === 'initial' ? (
            <ALetterStudio
              name={profile.name}
              font={font}
              colour={colour}
              colourTo={colourTo}
              onFont={setFont}
              onColour={(chosen) => {
                setColour(chosen);
                setColourTo(null);
              }}
              onGradient={(from, to) => {
                setColour(from);
                setColourTo(to);
              }}
            />
          ) : mode === 'drawn' ? (
            <ADrawnStudio
              style={drawn.style}
              seed={drawn.seed}
              colour={colour}
              isOnColour={isOnColour}
              onChange={setDrawn}
              onColour={(chosen) => {
                setColour(chosen);
                setColourTo(null);
                setIsOnColour(true);
              }}
              onClear={() => {
                setIsOnColour(false);
              }}
            />
          ) : (
            <APhotoStudio
              frame={frame}
              uri={framing}
              filter={filter}
              onPick={setPicked}
              onFrame={setFrame}
              onFilter={setFilter}
            />
          )}
        </View>
      </View>
    </ASheet>
  );
};

AFaceEditor.displayName = 'AFaceEditor';

export { AFaceEditor };

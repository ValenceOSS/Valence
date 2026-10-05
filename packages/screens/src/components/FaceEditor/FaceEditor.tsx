import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { DrawnStudio } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio';
import { FacePreviews } from '@ValenceScreens/components/FaceEditor/components/FacePreviews/FacePreviews';
import { LetterStudio } from '@ValenceScreens/components/FaceEditor/components/LetterStudio/LetterStudio';
import { PhotoStudio } from '@ValenceScreens/components/FaceEditor/components/PhotoStudio/PhotoStudio';
import { FACE_MODES } from '@ValenceClient/profiles/FACE_MODES';
import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { DrawnStyle } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio.types';
import type { FaceEditorProps } from './FaceEditor.types';
import { say } from '@ValenceI18n/say';

type Mode = (typeof FACE_MODES)[number]['id'];

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

/**
 * Where making a face begins: the kind of face somebody has now, so opening the editor shows what
 * they already have rather than a blank slate. An orb or a drawing, which can no longer be made, is
 * the picture it was saved as, so it opens on the photo studio.
 *
 * @param avatar - The face they have.
 */
const modeOf = (avatar: Avatar): Mode =>
  avatar.kind === 'orb' || avatar.kind === 'sketch' ? 'photo' : avatar.kind;

/**
 * Making somebody's face, of whichever kind they like — a picture of their own sat where they want
 * it in the circle, a drawn character, or their initial — with
 * the face shown large as it changes and at the sizes Valence draws it.
 *
 * Every kind remembers what was done to it while the editor is open, so trying another kind and
 * coming back loses nothing. Nothing is saved from here: using a face hands it to the profile's
 * own draft, which is saved with everything else about the profile.
 *
 * @param isOpen - Whether the editor is showing.
 * @param onClose - Told it was put away without using anything.
 * @param profile - Whose face this is.
 * @param start - The face as the profile's draft has it now.
 * @param onUse - Told the face to use.
 */
const FaceEditor = ({ isOpen, onClose, profile, start, onUse }: FaceEditorProps) => {
  const [mode, setMode] = useState<Mode>(modeOf(start.avatar));
  const [photo, setPhoto] = useState<File | null>(
    start.avatar.kind === 'photo' ? start.photo : null,
  );
  const [frame, setFrame] = useState<PhotoFrame>(
    start.avatar.kind === 'photo' ? (start.avatar.frame ?? UNFRAMED) : UNFRAMED,
  );
  const [drawn, setDrawn] = useState<{ style: DrawnStyle; seed: string }>(
    start.avatar.kind === 'drawn'
      ? { style: start.avatar.style, seed: start.avatar.seed }
      : { style: 'adventurer', seed: profile.id },
  );
  const [colour, setColour] = useState<ProfileColour>(start.colour);
  const [font, setFont] = useState<LetterFont>(
    start.avatar.kind === 'initial' ? start.avatar.font : 'gilroy',
  );

  const wasOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setMode(modeOf(start.avatar));
      setColour(start.colour);
    }

    wasOpen.current = isOpen;
  }, [isOpen, start]);

  const hadPhoto = profile.avatar.kind === 'photo';
  const photoIsVideo =
    photo === null
      ? profile.avatar.kind === 'photo' && profile.avatar.isVideo
      : photo.type.startsWith('video/');

  const avatar: Avatar =
    mode === 'photo'
      ? { kind: 'photo', isVideo: photoIsVideo, frame }
      : mode === 'drawn'
        ? { kind: 'drawn', ...drawn }
        : { kind: 'initial', font };

  const canUse = mode !== 'photo' || photo !== null || hadPhoto;

  const handOver = () => {
    onUse({ avatar, photo: mode === 'photo' ? photo : null, colour });
  };

  return (
    <Dialog
      label={say('screens.faceEditor.yourFace')}
      isOpen={isOpen}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        title={say('screens.faceEditor.yourFace')}
        detail={say('screens.faceEditor.howYouAppearOnEveryScreen')}
        size="compact"
      />

      <DialogContent>
        <div className="grid gap-10 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <FacePreviews
            name={profile.name}
            colour={colour}
            avatar={avatar}
            source={profileAvatarUrl(profile)}
            pending={mode === 'photo' ? photo : null}
            className="md:sticky md:top-0 md:self-start md:pt-4"
          />

          <div className="flex min-w-0 flex-col gap-8">
            <SegmentedRow
              label={say('screens.faceEditor.kindOfFace')}
              size="sm"
              tone="accent"
              items={FACE_MODES}
              value={mode}
              onSelect={(chosen) => {
                const next = FACE_MODES.find((one) => one.id === chosen);

                if (next !== undefined) {
                  setMode(next.id);
                }
              }}
            />

            {mode === 'photo' ? (
              <PhotoStudio
                fileName={photo?.name ?? null}
                hasPicture={photo !== null || hadPhoto}
                frame={frame}
                onPick={(file) => {
                  setPhoto(file);
                  setFrame(UNFRAMED);
                }}
                onFrame={setFrame}
              />
            ) : null}

            {mode === 'drawn' ? <DrawnStudio {...drawn} onChange={setDrawn} /> : null}

            {mode === 'initial' ? (
              <LetterStudio
                name={profile.name}
                colour={colour}
                font={font}
                onColour={setColour}
                onFont={setFont}
              />
            ) : null}
          </div>
        </div>
      </DialogContent>

      <DialogFooter
        dismiss={{ onChoose: onClose }}
        confirm={{
          label: say('screens.faceEditor.useThisFace'),
          isDisabled: !canUse,
          onChoose: handOver,
        }}
      />
    </Dialog>
  );
};

FaceEditor.displayName = 'FaceEditor';

export { FaceEditor };

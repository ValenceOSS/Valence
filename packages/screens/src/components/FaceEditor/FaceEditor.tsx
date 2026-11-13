import { drawingToShow } from '@ValenceClient/profiles/drawingToShow';
import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { DrawnStudio } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio';
import { FaceStage } from '@ValenceScreens/components/FaceEditor/components/FaceStage/FaceStage';
import { FaceSizes } from '@ValenceScreens/components/FaceEditor/components/FaceSizes/FaceSizes';
import { useFileAddress } from '@ValenceScreens/pictures/useFileAddress';
import { readPickedPicture } from '@ValenceScreens/pictures/readPickedPicture';
import { PICTURE_LIMITS } from '@ValenceContracts/constants/PICTURE_LIMITS';
import { notify } from '@ValenceUI/notify';
import { LetterStudio } from '@ValenceScreens/components/FaceEditor/components/LetterStudio/LetterStudio';
import { PhotoStudio } from '@ValenceScreens/components/FaceEditor/components/PhotoStudio/PhotoStudio';
import { FACE_MODES } from '@ValenceClient/profiles/FACE_MODES';
import type {
  Avatar,
  PhotoFilter,
  PhotoFrame,
  ProfileColour,
} from '@ValenceContracts/schemas/ViewerProfile';
import { toneOfFilter } from '@ValenceContracts/functions/toneOfFilter';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import { PLUS_JAKARTA_SANS_AS_STORED } from '@ValenceContracts/schemas/LetterFont';
import type { DrawnStyle } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio.types';
import type { FaceEditorProps } from './FaceEditor.types';
import { say } from '@ValenceI18n/say';

type Mode = (typeof FACE_MODES)[number]['id'];

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

/**
 * Making somebody's face, of whichever kind they like — a picture of their own sat where they want
 * it in the circle, a drawn character, or their initial — with
 * the face shown large as it changes and at the sizes Valence draws it.
 *
 * It opens on a picture of their own, whatever kind of face they have now. Every kind remembers what
 * was done to it while the editor is open, so trying another kind and coming back loses nothing. Nothing is saved from here: using a face hands it to the profile's
 * own draft, which is saved with everything else about the profile.
 *
 * @param isOpen - Whether the editor is showing.
 * @param onClose - Told it was put away without using anything.
 * @param profile - Whose face this is.
 * @param start - The face as the profile's draft has it now.
 * @param onUse - Told the face to use.
 */
const FaceEditor = ({ isOpen, onClose, profile, start, onUse }: FaceEditorProps) => {
  const [mode, setMode] = useState<Mode>('photo');
  const [photo, setPhoto] = useState<File | null>(
    start.avatar.kind === 'photo' ? start.photo : null,
  );
  const [preview, setPreview] = useState<File | null>(photo);
  const [filter, setFilter] = useState<PhotoFilter>(
    start.avatar.kind === 'photo' ? (start.avatar.filter ?? 'original') : 'original',
  );
  const [frame, setFrame] = useState<PhotoFrame>(
    start.avatar.kind === 'photo' ? (start.avatar.frame ?? UNFRAMED) : UNFRAMED,
  );
  const [isOnColour, setIsOnColour] = useState(
    start.avatar.kind === 'drawn' && start.avatar.isOnColour === true,
  );
  const [drawn, setDrawn] = useState<{ style: DrawnStyle; seed: string }>(
    start.avatar.kind === 'drawn'
      ? { style: start.avatar.style, seed: start.avatar.seed }
      : { style: 'adventurer', seed: profile.id },
  );
  const [colour, setColour] = useState<ProfileColour>(start.colour);
  const [colourTo, setColourTo] = useState<ProfileColour | null>(
    start.avatar.kind === 'initial' ? (start.avatar.colourTo ?? null) : null,
  );
  const [font, setFont] = useState<LetterFont>(
    start.avatar.kind === 'initial' ? start.avatar.font : PLUS_JAKARTA_SANS_AS_STORED,
  );

  const wasOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setMode('photo');
      setColour(start.colour);
      setColourTo(start.avatar.kind === 'initial' ? (start.avatar.colourTo ?? null) : null);
      setIsOnColour(start.avatar.kind === 'drawn' && start.avatar.isOnColour === true);
    }

    wasOpen.current = isOpen;
  }, [isOpen, start]);

  const hadPhoto = profile.avatar.kind === 'photo';
  const chosen = useFileAddress(mode === 'photo' ? preview : null);
  const source =
    mode === 'drawn'
      ? drawingToShow(drawn.style, drawn.seed, isOnColour ? colour : null)
      : profileAvatarUrl(profile);
  const photoIsVideo =
    photo === null
      ? profile.avatar.kind === 'photo' && profile.avatar.isVideo
      : photo.type.startsWith('video/');
  const placing =
    mode !== 'photo' || photoIsVideo
      ? null
      : (chosen ?? (hadPhoto && photo === null ? source : null));

  const avatar: Avatar =
    mode === 'photo'
      ? { kind: 'photo', isVideo: photoIsVideo, frame, hasFramedPicture: false, filter }
      : mode === 'drawn'
        ? { kind: 'drawn', ...drawn, ...(isOnColour ? { isOnColour: true } : {}) }
        : { kind: 'initial', font, ...(colourTo === null ? {} : { colourTo }) };

  const canUse = mode !== 'photo' || photo !== null || hadPhoto;

  const handOver = () => {
    onUse({ avatar, photo: mode === 'photo' ? photo : null, colour });
  };

  return (
    <Dialog
      label={say('screens.faceEditor.yourFace')}
      isOpen={isOpen}
      onClose={onClose}
      className="sm:w-[min(26rem,92vw)]"
    >
      <DialogTitle title={say('screens.faceEditor.yourFace')} size="compact" />

      <DialogContent>
        <div className="flex flex-col gap-4">
          <SegmentedRow
            label={say('screens.faceEditor.kindOfFace')}
            size="sm"
            tone="accent"
            fills
            items={FACE_MODES}
            value={mode}
            onSelect={(next) => {
              const found = FACE_MODES.find((one) => one.id === next);

              if (found !== undefined) {
                setMode(found.id);
              }
            }}
          />

          <FaceStage
            name={profile.name}
            colour={colour}
            avatar={avatar}
            source={source}
            pending={mode === 'photo' ? preview : null}
            framing={
              placing === null
                ? null
                : {
                    picture: placing,
                    frame,
                    tone: toneOfFilter(filter),
                    onFrame: setFrame,
                  }
            }
          />

          <div className="valence-scrollbar -mx-2 h-[11.25rem] overflow-y-auto overflow-x-hidden overscroll-contain px-2">
            {mode === 'photo' ? (
              <PhotoStudio
                hasPicture={photo !== null || hadPhoto}
                picture={placing}
                filter={filter}
                frame={frame}
                onPick={(file) => {
                  void readPickedPicture(file, PICTURE_LIMITS.face).then((read) => {
                    if ('refusal' in read) {
                      notify.failed(read.refusal);

                      return;
                    }

                    setPhoto(read.picture);
                    setPreview(read.preview);
                    setFrame(UNFRAMED);
                    setFilter('original');
                  });
                }}
                onFrame={setFrame}
                onFilter={setFilter}
              />
            ) : null}

            {mode === 'drawn' ? (
              <DrawnStudio
                {...drawn}
                colour={colour}
                onChange={setDrawn}
                isOnColour={isOnColour}
                onColour={(picked) => {
                  setColour(picked);
                  setColourTo(null);
                  setIsOnColour(true);
                }}
                onClear={() => {
                  setIsOnColour(false);
                }}
              />
            ) : null}

            {mode === 'initial' ? (
              <LetterStudio
                name={profile.name}
                colour={colour}
                colourTo={colourTo}
                font={font}
                onColour={(picked) => {
                  setColour(picked);
                  setColourTo(null);
                }}
                onGradient={(from, to) => {
                  setColour(from);
                  setColourTo(to);
                }}
                onFont={setFont}
              />
            ) : null}
          </div>

          <FaceSizes
            name={profile.name}
            colour={colour}
            avatar={avatar}
            source={source}
            pending={mode === 'photo' ? preview : null}
          />
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

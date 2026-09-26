import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@ValenceUI/Dialog';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { ORB_VARIANTS } from '@ValenceUI/orbs/ORB_VARIANTS';
import { orbPicture } from '@ValenceUI/orbs/orbPicture';
import { PROFILE_COLOURS, profileAvatarUrl } from '@ValenceContracts/schemas/ViewerProfile';
import { DrawnStudio } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio';
import { FacePreviews } from '@ValenceScreens/components/FaceEditor/components/FacePreviews/FacePreviews';
import { LetterStudio } from '@ValenceScreens/components/FaceEditor/components/LetterStudio/LetterStudio';
import { OrbStudio } from '@ValenceScreens/components/FaceEditor/components/OrbStudio/OrbStudio';
import { PhotoStudio } from '@ValenceScreens/components/FaceEditor/components/PhotoStudio/PhotoStudio';
import { SketchStudio } from '@ValenceScreens/components/FaceEditor/components/SketchStudio/SketchStudio';
import { sketchPicture } from '@ValenceScreens/library/sketch/sketchPicture';
import { FACE_MODES } from '@ValenceScreens/components/FaceEditor/faceModes';
import type { Avatar, PhotoFrame, ProfileColour } from '@ValenceContracts/schemas/ViewerProfile';
import type { LetterFont } from '@ValenceContracts/schemas/LetterFont';
import type { DrawnStyle } from '@ValenceScreens/components/FaceEditor/components/DrawnStudio/DrawnStudio.types';
import type { OrbChoice } from '@ValenceScreens/components/FaceEditor/components/OrbStudio/OrbStudio.types';
import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';
import type { FaceEditorProps } from './FaceEditor.types';

type Mode = (typeof FACE_MODES)[number]['id'];

const UNFRAMED: PhotoFrame = { zoom: 1, x: 0, y: 0 };

/**
 * Where making a face begins: the kind of face somebody has now, so opening the editor shows what
 * they already have rather than a blank slate.
 *
 * @param avatar - The face they have.
 */
const modeOf = (avatar: Avatar): Mode => avatar.kind;

/**
 * Making somebody's face, of whichever kind they like — an orb they have coloured and tuned, a
 * picture of their own sat where they want it in the circle, a drawing of their own, a drawn
 * character, or their initial — with
 * the face shown large as it changes and at the sizes Valence draws it.
 *
 * Every kind remembers what was done to it while the editor is open, so trying another kind and
 * coming back loses nothing. Nothing is saved from here: using a face hands it to the profile's
 * own draft, which is saved with everything else about the profile.
 *
 * An orb or a drawing is handed over with a still of itself, taken as it is used, because the
 * phone and the
 * television draw pictures rather than shaders.
 *
 * @param isOpen - Whether the editor is showing.
 * @param onClose - Told it was put away without using anything.
 * @param profile - Whose face this is.
 * @param start - The face as the profile's draft has it now.
 * @param onUse - Told the face to use.
 */
const FaceEditor = ({ isOpen, onClose, profile, start, onUse }: FaceEditorProps) => {
  const [mode, setMode] = useState<Mode>(modeOf(start.avatar));
  const [orb, setOrb] = useState<OrbChoice>(
    start.avatar.kind === 'orb'
      ? { orb: start.avatar.orb, params: start.avatar.params, colours: start.avatar.colours }
      : { orb: ORB_VARIANTS[0]?.key ?? 'orbital', params: {}, colours: {} },
  );
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
  const [scene, setScene] = useState<SketchScene>(
    start.avatar.kind === 'sketch'
      ? start.avatar.scene
      : { background: PROFILE_COLOURS[16], items: [] },
  );
  const [isUsing, setIsUsing] = useState(false);

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
    mode === 'orb'
      ? { kind: 'orb', ...orb }
      : mode === 'photo'
        ? { kind: 'photo', isVideo: photoIsVideo, frame }
        : mode === 'sketch'
          ? { kind: 'sketch', scene }
          : mode === 'drawn'
            ? { kind: 'drawn', ...drawn }
            : { kind: 'initial', font };

  const canUse = mode !== 'photo' || photo !== null || hadPhoto;

  const handOver = async () => {
    if (mode !== 'orb' && mode !== 'sketch') {
      onUse({ avatar, photo: mode === 'photo' ? photo : null, colour });

      return;
    }

    const variant = ORB_VARIANTS.find((one) => one.key === orb.orb);

    setIsUsing(true);

    const still =
      mode === 'sketch'
        ? await sketchPicture(scene)
        : variant === undefined
          ? null
          : await orbPicture(variant, orb);

    setIsUsing(false);
    onUse({
      avatar,
      photo: still === null ? null : new File([still], `${mode}.png`, { type: 'image/png' }),
      colour,
    });
  };

  return (
    <Dialog label="Your face" isOpen={isOpen} onClose={onClose} size="stage">
      <DialogTitle
        title="Your face"
        detail="How you appear on every screen Valence draws you on."
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
              label="Kind of face"
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

            {mode === 'orb' ? <OrbStudio value={orb} onChange={setOrb} /> : null}

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

            {mode === 'sketch' ? <SketchStudio scene={scene} onChange={setScene} /> : null}

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
          label: 'Use this face',
          isDisabled: !canUse,
          isLoading: isUsing,
          onChoose: () => {
            void handOver();
          },
        }}
      />
    </Dialog>
  );
};

FaceEditor.displayName = 'FaceEditor';

export { FaceEditor };

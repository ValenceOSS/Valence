import { Icon } from '@ValenceUI/Icon';
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from '@hugeicons/core-free-icons';
import { useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { Button } from '@ValenceUI/Button';
import { revealVariants, revealTransition, staggerVariants } from '@ValenceUI/animations/reveal';
import { removeProfile } from '@ValenceClient/profiles/fetchProfiles';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { ProfileEditor } from './components/ProfileEditor/ProfileEditor';
import type { ViewerProfile } from '@ValenceContracts/schemas/ViewerProfile';
import type { ProfilePickerProps } from './ProfilePicker.types';

const PROFILE_LIMIT = 6;
/**
 * Asks who is watching, as a row of faces. In editable mode it also carries the way to add, change
 * and remove profiles, which is the same set of faces with a different gesture attached rather than
 * a separate screen.
 *
 * @param profiles - The household's profiles.
 * @param onChoose - Called with the profile somebody picked.
 * @param onChanged - Called after a profile is created, edited or removed.
 * @param isEditable - Whether the faces are here to be chosen or to be managed.
 */
const ProfilePicker = ({
  profiles,
  onChoose,
  onChanged,
  isEditable = false,
}: ProfilePickerProps) => {
  const [editing, setEditing] = useState<ViewerProfile | 'new' | null>(null);
  const [removing, setRemoving] = useState<ViewerProfile | null>(null);
  const prefersReducedMotion = useReducedMotionConfig();

  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      animate="shown"
      className="flex min-h-svh flex-col items-center justify-center gap-12 px-6 py-16"
    >
      <motion.h1
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
        className="text-[clamp(2rem,7vw,4rem)] font-semibold tracking-[-0.04em] text-text"
      >
        Who is watching?
      </motion.h1>

      <motion.ul
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion)}
        className="flex flex-wrap items-start justify-center gap-6 sm:gap-10"
      >
        {profiles.map((profile) => (
          <li key={profile.id} className="relative">
            <motion.button
              type="button"
              onClick={() => {
                onChoose(profile);
              }}
              {...(prefersReducedMotion === true
                ? {}
                : {
                    whileHover: { transform: 'translateY(-6px)' },
                    whileTap: { transform: 'scale(0.97)' },
                  })}
              transition={revealTransition(prefersReducedMotion)}
              className="flex w-24 flex-col items-center gap-3 sm:w-32"
            >
              <ProfileFace
                profile={profile}
                className="aspect-square w-full rounded-lg text-4xl shadow-lg sm:text-5xl"
              />

              <span className="w-full truncate text-center text-sm text-text-muted">
                {profile.name}
              </span>
            </motion.button>

            {!isEditable ? null : (
              <span className="absolute -right-2 -top-2 flex gap-1">
                <Button
                  isIconOnly
                  variant="glossy"
                  label={`Edit ${profile.name}`}
                  onClick={() => {
                    setEditing(profile);
                  }}
                >
                  <Icon of={PencilEdit01Icon} size={16} />
                </Button>

                {profiles.length < 2 ? null : (
                  <Button
                    isIconOnly
                    variant="glossy"
                    label={`Remove ${profile.name}`}
                    onClick={() => {
                      setRemoving(profile);
                    }}
                  >
                    <Icon of={Delete02Icon} size={16} />
                  </Button>
                )}
              </span>
            )}
          </li>
        ))}

        {!isEditable || profiles.length >= PROFILE_LIMIT ? null : (
          <li>
            <Button
              variant="bare"
              size="none"
              onClick={() => {
                setEditing('new');
              }}
              className="flex w-24 flex-col items-center gap-3 sm:w-32"
            >
              <span className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-line text-text-muted">
                <Icon of={Add01Icon} size={28} />
              </span>

              <span className="text-sm text-text-muted">Add</span>
            </Button>
          </li>
        )}
      </motion.ul>

      <ConfirmDialog
        isOpen={removing !== null}
        title={removing === null ? 'Remove this profile?' : `Remove ${removing.name}?`}
        detail={
          removing === null
            ? ''
            : `Everything ${removing.name} has watched goes with them — their history, where they had got to, what they liked, how they rated things and what they had hidden. Playlists they shared with the household stay, and their own go. Nothing leaves the library, and this cannot be undone.`
        }
        confirmLabel="Remove profile"
        isDestructive
        onClose={() => {
          setRemoving(null);
        }}
        onConfirm={() => {
          const going = removing;

          setRemoving(null);

          if (going !== null) {
            void removeProfile(going.id).then(onChanged);
          }
        }}
      />

      {editing === null ? null : (
        <motion.div
          variants={revealVariants(prefersReducedMotion)}
          transition={revealTransition(prefersReducedMotion)}
          className="flex w-full justify-center"
        >
          <ProfileEditor
            profile={editing === 'new' ? null : editing}
            onSaved={() => {
              setEditing(null);
              onChanged();
            }}
            onCancel={() => {
              setEditing(null);
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

ProfilePicker.displayName = 'ProfilePicker';

export { ProfilePicker };

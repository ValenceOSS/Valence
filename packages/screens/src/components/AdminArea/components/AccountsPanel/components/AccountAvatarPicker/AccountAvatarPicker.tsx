import { Icon } from '@ValenceUI/Icon';
import { Image as ImageIcon, RefreshCw as RefreshCwIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { FormField } from '@ValenceUI/FormField';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import type { AccountAvatarPickerProps } from './AccountAvatarPicker.types';
import { say } from '@ValenceI18n/say';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/webm,video/mp4';

/**
 * An account's picture, drawn face and colour, changed on its behalf. Held as a draft like the rest
 * of the Display tab — nothing here reaches the server until the dialog is saved.
 *
 * @param accountId - Whose account it is, which is what the picture is addressed by.
 * @param face - Its household, or null where it has none yet.
 * @param draft - How it would look if saved.
 * @param onDraft - Told what changed.
 */
const AccountAvatarPicker = ({ accountId, face, draft, onDraft }: AccountAvatarPickerProps) => {
  const seed = accountId;

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label={say('admin.accountAvatarPicker.picture')}
        description={
          draft.photo === null
            ? say('admin.accountAvatarPicker.pictureDescription')
            : say('admin.accountAvatarPicker.pictureChosen', { file: draft.photo.name })
        }
      >
        <div className="flex items-center gap-3">
          <HouseholdFace
            shape="tile"
            household={{
              name: face?.name ?? '',
              colour: draft.colour,
              avatar: draft.avatar,
              updatedAt: face?.updatedAt ?? '',
            }}
            accountId={accountId}
            pending={draft.photo}
            className="size-9 shrink-0 text-xs"
          />

          <FilePicker
            label={say('admin.accountAvatarPicker.uploadLabel')}
            accept={PHOTO_TYPES}
            size="sm"
            onPick={(file) => {
              onDraft({
                photo: file,
                avatar: { kind: 'photo', isVideo: file.type.startsWith('video/') },
              });
            }}
          >
            <Icon of={ImageIcon} size={15} />
            {say('admin.accountAvatarPicker.upload')}
          </FilePicker>
        </div>
      </FormField>

      <FormField
        label={say('admin.accountAvatarPicker.drawnFace')}
        description={say('admin.accountAvatarPicker.drawnFaceDescription')}
      >
        <div className="flex flex-wrap items-center gap-2">
          {AVATAR_STYLES.map((style) => (
            <Button
              key={style}
              variant="bare"
              size="none"
              label={say('admin.accountAvatarPicker.useFace', { style })}
              isActive={draft.avatar.kind === 'drawn' && draft.avatar.style === style}
              className={`size-8 overflow-hidden rounded-lg bg-subtle transition-transform ${
                draft.avatar.kind === 'drawn' && draft.avatar.style === style
                  ? 'ring-2 ring-accent'
                  : 'hover-hover:hover:scale-105'
              }`}
              onClick={() => {
                onDraft({ avatar: { kind: 'drawn', style, seed }, photo: null });
              }}
            >
              <img
                src={`/api/profiles/avatars/${style}?seed=${encodeURIComponent(seed)}`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </Button>
          ))}

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            label={say('admin.accountAvatarPicker.useInitial')}
            onClick={() => {
              onDraft({ avatar: { kind: 'initial' }, photo: null });
            }}
          >
            <Icon of={RefreshCwIcon} size={16} />
          </Button>
        </div>
      </FormField>

      <FormField
        label={say('admin.accountAvatarPicker.colour')}
        description={say('admin.accountAvatarPicker.colourDescription')}
      >
        <div className="flex flex-wrap items-center gap-2">
          {PROFILE_COLOURS.map((option) => (
            <Button
              key={option}
              variant="bare"
              size="none"
              label={say('admin.accountAvatarPicker.useColour', { colour: option })}
              isActive={option === draft.colour}
              style={{ backgroundColor: option }}
              className={`size-6 rounded-full transition-transform ${
                option === draft.colour
                  ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]'
                  : 'hover-hover:hover:scale-105'
              }`}
              onClick={() => {
                onDraft({ colour: option });
              }}
            />
          ))}
        </div>
      </FormField>
    </div>
  );
};

AccountAvatarPicker.displayName = 'AccountAvatarPicker';

export { AccountAvatarPicker };

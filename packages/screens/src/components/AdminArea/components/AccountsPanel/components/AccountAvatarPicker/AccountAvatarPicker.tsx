import { Icon } from '@ValenceUI/Icon';
import { Image01Icon, RefreshIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { FormField } from '@ValenceUI/FormField';
import { AVATAR_STYLES, PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { HouseholdFace } from '@ValenceScreens/components/HouseholdFace/HouseholdFace';
import type { AccountAvatarPickerProps } from './AccountAvatarPicker.types';

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
        label="Picture"
        description={
          draft.photo === null
            ? 'A photograph, one of the drawn faces, or the first letter of their name.'
            : `${draft.photo.name} — saved when you save this dialog.`
        }
      >
        <div className="flex items-center gap-3">
          <HouseholdFace
            household={{
              name: face?.name ?? '',
              colour: draft.colour,
              avatar: draft.avatar,
              updatedAt: face?.updatedAt ?? '',
            }}
            accountId={accountId}
            pending={draft.photo}
            className="size-9 shrink-0 rounded-lg text-xs"
          />

          <FilePicker
            label="Upload a picture"
            accept={PHOTO_TYPES}
            onPick={(file) => {
              onDraft({
                photo: file,
                avatar: { kind: 'photo', isVideo: file.type.startsWith('video/') },
              });
            }}
          >
            <span className="inline-flex h-8 items-center gap-1.5 rounded-pill border border-accent/30 bg-accent/15 px-3.5 text-[0.8125rem] font-medium text-accent transition-colors hover:bg-accent/25">
              <Icon of={Image01Icon} size={15} />
              Upload
            </span>
          </FilePicker>
        </div>
      </FormField>

      <FormField
        label="Drawn face"
        description="Where a photograph is not wanted, pick one of these."
      >
        <div className="flex flex-wrap items-center gap-2">
          {AVATAR_STYLES.map((style) => (
            <Button
              key={style}
              variant="bare"
              size="none"
              label={`Use the ${style} face`}
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
            label="Use their initial instead"
            onClick={() => {
              onDraft({ avatar: { kind: 'initial' }, photo: null });
            }}
          >
            <Icon of={RefreshIcon} size={16} />
          </Button>
        </div>
      </FormField>

      <FormField
        label="Colour"
        description="The background behind their initial, and the tint on their drawn face."
      >
        <div className="flex flex-wrap items-center gap-2">
          {PROFILE_COLOURS.map((option) => (
            <Button
              key={option}
              variant="bare"
              size="none"
              label={`Use ${option}`}
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

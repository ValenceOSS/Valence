import { say } from '@ValenceI18n/say';
import { Icon } from '@ValenceUI/Icon';
import { Image as ImageIcon, RefreshCw as RefreshCwIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { FilePicker } from '@ValenceUI/FilePicker';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { readTheme } from '@ValenceClient/shell/theme';
import { THEME_CHOICES } from '@ValenceScreens/theme/themeChoices';
import { useMotion } from '@ValenceClient/shell/useMotion';
import { readMotion } from '@ValenceClient/shell/motion';
import { MOTION_CHOICES } from '@ValenceScreens/motion/motionChoices';
import { Switch } from '@ValenceUI/Switch';
import { canShowOnDiscord } from '@ValenceClient/discord/canShowOnDiscord';
import { PROFILE_COLOURS, AVATAR_STYLES } from '@ValenceContracts/schemas/ViewerProfile';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { STILL_WATCHING_CHOICES } from '@ValenceClient/profiles/STILL_WATCHING_CHOICES';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import type { ProfileSettingsProps } from './ProfileSettings.types';

const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/webm,video/mp4';

/**
 * Everything about how somebody appears: their name, their picture, the colour behind it, and how
 * patient Valence is about asking whether they are still there.
 *
 * Nothing here writes. Every control changes a draft the dialog holds, and one button in the foot
 * commits the lot — because these are four facets of one profile rather than four settings, and
 * answering them one write at a time means a stranger can see half a change while somebody is still
 * making up their mind about the rest.
 *
 * The rows are handed out loose rather than in a list of their own, so that whoever is drawing the
 * panel can run one hairline down the whole of it instead of stacking several boxed groups.
 *
 * @param profile - The profile as the server holds it, or nothing while it is being read.
 * @param draft - The profile as it would be saved, or nothing while there is nothing to change.
 * @param onDraft - Told what somebody changed.
 */
const ProfileSettings = ({ profile, draft, onDraft }: ProfileSettingsProps) => {
  const { theme, choose } = useTheme();
  const { motion, choose: chooseMovement } = useMotion();

  const isReady = profile !== null && draft !== null;
  const seed = profile?.id ?? 'valence';

  return (
    <>
      <SettingRow
        title={say('screens.profileSettings.nameTitle')}
        description={say('screens.profileSettings.nameDescription')}
      >
        <TextField
          label={say('screens.profileSettings.nameTitle')}
          isLabelHidden
          value={draft?.name ?? ''}
          onValueChange={(next) => {
            onDraft({ name: next });
          }}
          placeholder={profile?.name ?? say('screens.profileSettings.namePlaceholder')}
          disabled={!isReady}
          size="sm"
          className="w-56"
        />
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.pictureTitle')}
        description={
          draft?.photo === null || draft?.photo === undefined
            ? say('screens.profileSettings.pictureDescription')
            : say('screens.profileSettings.picturePending', { file: draft.photo.name })
        }
      >
        {profile === null || draft === null ? null : (
          <ProfileFace
            shape="tile"
            profile={{ ...profile, name: draft.name, colour: draft.colour, avatar: draft.avatar }}
            pending={draft.photo}
            className="size-8 shrink-0 text-xs"
          />
        )}

        <FilePicker
          label={say('screens.profileSettings.uploadLabel')}
          accept={PHOTO_TYPES}
          size="sm"
          disabled={!isReady}
          onPick={(file) => {
            onDraft({
              photo: file,
              avatar: { kind: 'photo', isVideo: file.type.startsWith('video/') },
            });
          }}
        >
          <Icon of={ImageIcon} size={15} />
          {say('screens.profileSettings.upload')}
        </FilePicker>
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.drawnTitle')}
        description={say('screens.profileSettings.drawnDescription')}
      >
        {AVATAR_STYLES.map((style) => (
          <Button
            key={style}
            variant="bare"
            size="none"
            label={say('screens.profileSettings.useDrawn', { style })}
            isActive={draft?.avatar.kind === 'drawn' && draft.avatar.style === style}
            disabled={!isReady}
            className={`size-8 overflow-hidden rounded-lg bg-subtle transition-transform ${
              draft?.avatar.kind === 'drawn' && draft.avatar.style === style
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
          label={say('screens.profileSettings.useInitial')}
          disabled={!isReady}
          onClick={() => {
            onDraft({ avatar: { kind: 'initial' }, photo: null });
          }}
        >
          <Icon of={RefreshCwIcon} size={16} />
        </Button>
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.themeTitle')}
        description={say('screens.profileSettings.themeDescription')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('screens.profileSettings.themeTitle')}
          value={theme}
          items={THEME_CHOICES}
          onSelect={(chosen) => {
            choose(readTheme(chosen));
          }}
        />
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.movementTitle')}
        description={say('screens.profileSettings.movementDescription')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('screens.profileSettings.movementTitle')}
          value={motion}
          items={MOTION_CHOICES}
          onSelect={(chosen) => {
            chooseMovement(readMotion(chosen));
          }}
        />
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.colourTitle')}
        description={say('screens.profileSettings.colourDescription')}
      >
        {PROFILE_COLOURS.map((option) => (
          <Button
            key={option}
            variant="bare"
            size="none"
            label={say('screens.profileSettings.useColour', { colour: option })}
            isActive={option === draft?.colour}
            disabled={!isReady}
            style={{ backgroundColor: option }}
            className={`size-6 rounded-full transition-transform ${
              option === draft?.colour
                ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--color-surface-raised)]'
                : 'hover-hover:hover:scale-105'
            }`}
            onClick={() => {
              onDraft({ colour: option });
            }}
          />
        ))}
      </SettingRow>

      <SettingRow
        title={say('screens.profileSettings.stillWatchingTitle')}
        description={say('screens.profileSettings.stillWatchingDescription')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('screens.profileSettings.stillWatchingTitle')}
          items={STILL_WATCHING_CHOICES}
          value={
            draft === null || draft.askStillWatchingAfter === STILL_WATCHING_OFF
              ? 'off'
              : draft.askStillWatchingAfter.toString()
          }
          onSelect={(chosen) => {
            onDraft({
              askStillWatchingAfter: chosen === 'off' ? STILL_WATCHING_OFF : Number(chosen),
            });
          }}
        />
      </SettingRow>

      {canShowOnDiscord() ? (
        <SettingRow
          title={say('screens.profileSettings.discordTitle')}
          description={say('screens.profileSettings.discordDescription')}
        >
          <Switch
            label={say('screens.profileSettings.discordTitle')}
            isLabelHidden
            isOn={draft?.showsWhatIamWatching ?? false}
            disabled={!isReady}
            onToggle={() => {
              onDraft({ showsWhatIamWatching: !(draft?.showsWhatIamWatching ?? false) });
            }}
          />
        </SettingRow>
      ) : null}
    </>
  );
};

ProfileSettings.displayName = 'ProfileSettings';

export { ProfileSettings };

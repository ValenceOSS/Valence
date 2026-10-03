import { useState } from 'react';
import { Icon } from '@ValenceUI/Icon';
import { PenSparkles as EditIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
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
import { PROFILE_COLOURS } from '@ValenceContracts/schemas/ViewerProfile';
import { STILL_WATCHING_OFF } from '@ValenceContracts/schemas/StillWatching';
import { STILL_WATCHING_CHOICES } from '@ValenceClient/profiles/STILL_WATCHING_CHOICES';
import { ProfileFace } from '@ValenceScreens/components/ProfileFace/ProfileFace';
import { FaceEditor } from '@ValenceScreens/components/FaceEditor/FaceEditor';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { PluginThemeRow } from '@ValenceScreens/components/AccountArea/components/PluginThemeRow/PluginThemeRow';
import type { ProfileSettingsProps } from './ProfileSettings.types';
import { say } from '@ValenceI18n/say';

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

  const [isEditing, setIsEditing] = useState(false);
  const isReady = profile !== null && draft !== null;

  return (
    <>
      <SettingRow
        title={say('screens.accountArea.profileSettings.displayName')}
        description={say('screens.accountArea.profileSettings.whatEverybodySharingThisServerSees')}
      >
        <TextField
          label={say('screens.accountArea.profileSettings.displayName')}
          isLabelHidden
          value={draft?.name ?? ''}
          onValueChange={(next) => {
            onDraft({ name: next });
          }}
          placeholder={profile?.name ?? say('common.yourName')}
          disabled={!isReady}
          size="sm"
          className="w-56"
        />
      </SettingRow>

      <SettingRow
        title={say('screens.faceEditor.yourFace')}
        description={
          draft?.photo === null || draft?.photo === undefined
            ? say('screens.accountArea.profileSettings.anOrbAPhotographOrGIF')
            : say('screens.accountArea.profileSettings.yourNewFaceIsSavedWhen')
        }
      >
        {profile === null || draft === null ? null : (
          <ProfileFace
            shape="tile"
            profile={{ ...profile, name: draft.name, colour: draft.colour, avatar: draft.avatar }}
            pending={draft.avatar.kind === 'photo' ? draft.photo : null}
            className="size-10 shrink-0 text-sm"
          />
        )}

        <Button
          variant="secondary"
          size="sm"
          disabled={!isReady}
          onClick={() => {
            setIsEditing(true);
          }}
        >
          <Icon of={EditIcon} size={15} />
          {say('common.edit')}
        </Button>

        {profile === null || draft === null ? null : (
          <FaceEditor
            isOpen={isEditing}
            onClose={() => {
              setIsEditing(false);
            }}
            profile={profile}
            start={{ avatar: draft.avatar, photo: draft.photo, colour: draft.colour }}
            onUse={(choice) => {
              onDraft(choice);
              setIsEditing(false);
            }}
          />
        )}
      </SettingRow>

      <SettingRow
        title={say('common.theme')}
        description={say('screens.accountArea.profileSettings.keptOnThisDeviceRatherThan')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('common.theme')}
          value={theme}
          items={THEME_CHOICES}
          onSelect={(chosen) => {
            choose(readTheme(chosen));
          }}
        />
      </SettingRow>

      <PluginThemeRow />

      <SettingRow
        title={say('common.movement')}
        description={say('screens.accountArea.profileSettings.followingTheMachineUsesWhateverYour')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('common.movement')}
          value={motion}
          items={MOTION_CHOICES}
          onSelect={(chosen) => {
            chooseMovement(readMotion(chosen));
          }}
        />
      </SettingRow>

      <SettingRow
        title={say('common.colour')}
        description={say('screens.accountArea.profileSettings.theBackgroundBehindYourInitialAnd')}
      >
        <ColourChoice
          label={say('common.colour')}
          value={draft?.colour ?? PROFILE_COLOURS[3]}
          presets={PROFILE_COLOURS.slice(0, 6)}
          onChange={(colour) => {
            onDraft({ colour });
          }}
        />
      </SettingRow>

      <SettingRow
        title={say('common.askIfYouAreStillWatching')}
        description={say('screens.accountArea.profileSettings.afterThisManyEpisodesPlayBy')}
      >
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('common.askIfYouAreStillWatching')}
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

      <SettingRow
        title={say('screens.accountArea.profileSettings.preferTheBestCopy')}
        description={say('screens.accountArea.profileSettings.whereALinkedServerHasABetter')}
      >
        <Switch
          label={say('screens.accountArea.profileSettings.preferTheBestCopy')}
          isLabelHidden
          isOn={draft?.prefersBestCopy ?? false}
          disabled={!isReady}
          onToggle={() => {
            onDraft({ prefersBestCopy: !(draft?.prefersBestCopy ?? false) });
          }}
        />
      </SettingRow>

      {canShowOnDiscord() ? (
        <SettingRow
          title={say('screens.accountArea.profileSettings.showWhatIAmPlayingOn')}
          description={say('screens.accountArea.profileSettings.theTitleAndTheSeriesAnd')}
        >
          <Switch
            label={say('screens.accountArea.profileSettings.showWhatIAmPlayingOn')}
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

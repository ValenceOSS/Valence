import { Check } from '@keyline-icons/react-native';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { PlayerPanel } from '@ValenceTv/screens/Player/components/PlayerPanel/PlayerPanel';
import type { TrackMenuProps } from './TrackMenu.types';

/**
 * A panel down the right of the picture listing the subtitles, or the sound tracks, there are to
 * choose from, with the one in use ticked, as the television's own player lists them. The remote
 * starts on the one in use; Menu closes it without changing anything. A choice not worth making is
 * shown dimmed and passed by.
 *
 * @param title - What is being chosen.
 * @param choices - What there is to choose.
 * @param chosen - The one in use.
 * @param onChoose - Told which was chosen.
 */
const TrackMenu = ({ title, choices, chosen, onChoose }: TrackMenuProps) => (
  <PlayerPanel title={title}>
    {choices.map((choice) => (
      <ActionRow
        key={choice.id}
        label={choice.label}
        {...(choice.detail === undefined ? {} : { detail: choice.detail })}
        {...(choice.id === chosen ? { icon: Check } : {})}
        hasPreferredFocus={choice.id === chosen}
        isDisabled={choice.isDisabled === true}
        onPress={() => {
          if (choice.isDisabled !== true) {
            onChoose(choice.id);
          }
        }}
      />
    ))}
  </PlayerPanel>
);

TrackMenu.displayName = 'TrackMenu';

export { TrackMenu };

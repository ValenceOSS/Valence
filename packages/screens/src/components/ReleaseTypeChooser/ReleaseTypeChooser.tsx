import { Info as InfoFilledIcon } from '@keyline-icons/react/fill';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { RELEASE_TYPES } from '@ValenceContracts/schemas/MediaRequest';
import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import type { ReleaseTypeChooserProps } from './ReleaseTypeChooser.types';
import { say } from '@ValenceI18n/say';

/**
 * Which kinds of an artist's releases to fetch, now and as new ones come out — albums, EPs,
 * singles, live records and compilations — chosen from one field, in the order they are offered,
 * with what the choice means behind an icon beside it.
 *
 * @param value - The kinds chosen.
 * @param onChange - Told the kinds as they change, in the order they are offered.
 */
const ReleaseTypeChooser = ({ value, onChange }: ReleaseTypeChooserProps) => (
  <div className="flex items-center gap-1.5">
    <MultiSelectField
      label={say('common.releases')}
      isLabelHidden
      placeholder={say('common.none')}
      className="flex-1"
      options={RELEASE_TYPES.map((type) => ({ id: type, label: RELEASE_TYPE_NAMES[type].label }))}
      value={value}
      onChange={(next) => {
        onChange(RELEASE_TYPES.filter((type) => next.includes(type)));
      }}
    />

    <HoverCard
      side="bottom"
      align="end"
      detail={say('screens.releaseTypeChooser.whichOfTheirReleasesAreFetched')}
    >
      <Icon
        of={InfoFilledIcon}
        size={15}
        tone="muted"
        label={say('screens.adminArea.statStrip.aboutLabel', { label: say('common.releases') })}
      />
    </HoverCard>
  </div>
);

ReleaseTypeChooser.displayName = 'ReleaseTypeChooser';

export { ReleaseTypeChooser };

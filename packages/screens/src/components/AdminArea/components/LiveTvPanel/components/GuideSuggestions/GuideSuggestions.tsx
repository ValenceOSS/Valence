import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import type { GuideSuggestionsProps } from './GuideSuggestions.types';

const SUGGESTED = [
  {
    id: 'epgPw',
    label: say('screens.adminArea.liveTvPanel.ukGuideEpgPw'),
    address: 'https://epg.pw/xmltv/epg_GB.xml',
  },
  {
    id: 'epgShare',
    label: say('screens.adminArea.liveTvPanel.ukGuideEpgShare'),
    address: 'https://epgshare01.online/epgshare01/epg_ripper_UK1.xml.gz',
  },
  {
    id: 'samsung',
    label: say('screens.adminArea.liveTvPanel.samsungTvPlusGuide'),
    address: 'https://i.mjh.nz/SamsungTVPlus/all.xml.gz',
  },
  {
    id: 'pluto',
    label: say('screens.adminArea.liveTvPanel.plutoTvGuide'),
    address: 'https://i.mjh.nz/PlutoTV/us.xml.gz',
  },
] as const;

/**
 * Free programme guides known to cover a good share of the channels free playlists list, each a
 * button that adds its address to the guides chosen, for an admin who has no guide of their own.
 * One already chosen is not offered again.
 *
 * @param chosen - The guides' addresses chosen so far, separated by spaces.
 * @param onAdd - Told the address of a guide to add.
 */
const GuideSuggestions = ({ chosen, onAdd }: GuideSuggestionsProps) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs text-text-muted">
      {say('screens.adminArea.liveTvPanel.freeGuidesThatCoverManyChannels')}
    </span>
    <span className="flex flex-wrap gap-1.5">
      {SUGGESTED.filter((guide) => !chosen.includes(guide.address)).map((guide) => (
        <Button
          key={guide.id}
          variant="soft"
          size="xs"
          isPill
          onClick={() => {
            onAdd(guide.address);
          }}
        >
          <Icon of={PlusIcon} size={12} />
          {guide.label}
        </Button>
      ))}
    </span>
  </div>
);

GuideSuggestions.displayName = 'GuideSuggestions';

export { GuideSuggestions };

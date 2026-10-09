import { Badge } from '@ValenceUI/Badge';
import { Switch } from '@ValenceUI/Switch';
import { Tooltip } from '@ValenceUI/Tooltip';
import { partOfItem } from '@ValenceClient/requests/partOfItem';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { TITLE_PART_LOOKS } from '@ValenceScreens/requests/TITLE_PART_LOOKS';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import type { ItemListProps } from './ItemList.types';
import { say } from '@ValenceI18n/say';

/**
 * What a request waits for, one row each, where there is more than one and no seasons to group it
 * by — an artist's albums: its title and when it came out, how many of its tracks came where fewer
 * did than its longest edition has, the quality the library holds it at where a lossless copy is
 * looked for, where it stands, with why on hover where something went wrong, and a switch to follow
 * it.
 *
 * @param title - What the list is.
 * @param request - The request.
 * @param items - What it waits for.
 * @param isFollowing - Whether follow switches can be pressed right now.
 * @param onFollow - Told something to follow or stop following.
 */
const ItemList = ({ title, request, items, isFollowing, onFollow }: ItemListProps) => (
  <PanelCard title={title} isFlush>
    <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
      {items.map((item) => {
        const look = TITLE_PART_LOOKS[partOfItem(item, request.approval)];
        const problem = item.problem?.message ?? null;

        return (
          <li key={item.id} className="flex flex-wrap items-center gap-4 py-3 pl-5 pr-3">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-text">{item.title}</span>
              {item.airDate === null ? null : (
                <span className="text-xs text-text-muted">{item.airDate.slice(0, 4)}</span>
              )}
              {(item.trackCount ?? null) === null ||
              (item.filedTrackCount ?? null) === null ||
              (item.filedTrackCount ?? 0) >= (item.trackCount ?? 0) ? null : (
                <span className="text-xs text-text-muted">
                  {say('screens.adminArea.titlePage.itemList.filedOfTotalTracks', {
                    filed: (item.filedTrackCount ?? 0).toString(),
                    total: (item.trackCount ?? 0).toString(),
                  })}
                </span>
              )}
              {item.heldQuality === null || item.heldQuality === undefined ? null : (
                <span className="text-xs text-text-muted">
                  {say('screens.adminArea.titlePage.itemList.youHaveItAsQuality', {
                    quality: QUALITY_NAMES[item.heldQuality],
                  })}
                </span>
              )}
              {item.format === null || item.format === undefined ? null : (
                <span className="text-xs text-text-muted">
                  {item.format === 'audiobook' ? say('common.audiobook') : say('common.ebook')}
                </span>
              )}
            </span>

            <Tooltip label={problem ?? ''} isDisabled={problem === null}>
              <span
                tabIndex={problem === null ? undefined : 0}
                className="w-32 shrink-0 rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
              >
                <Badge size="sm" tone={look.tone}>
                  {look.label}
                </Badge>
              </span>
            </Tooltip>

            <Switch
              label={say('screens.adminArea.titlePage.seasonList.followName', { name: item.title })}
              isLabelHidden
              isOn={item.isFollowed}
              disabled={isFollowing}
              onToggle={() => {
                onFollow(item, !item.isFollowed);
              }}
            />
          </li>
        );
      })}
    </ul>
  </PanelCard>
);

ItemList.displayName = 'ItemList';

export { ItemList };

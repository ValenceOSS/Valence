import { Info as InfoIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { HoverCard } from '@ValenceUI/HoverCard';
import { Icon } from '@ValenceUI/Icon';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { valenceOwnBytes } from '@ValenceScreens/components/AdminArea/valenceOwnBytes';
import { InfoRow } from '@ValenceUI/InfoRow';
import { InfoHeading } from '@ValenceUI/InfoHeading';
import { InfoNote } from '@ValenceUI/InfoNote';
import { useTicking } from '@ValenceScreens/clock/useTicking';
import { A_CAPTION_AGES_EVERY } from '@ValenceScreens/clock/A_CAPTION_AGES_EVERY';
import type { StorageInfoProps } from './StorageInfo.types';
import { say } from '@ValenceI18n/say';

/**
 * What the storage card's figures come to, behind the mark in its corner: when the disk was last
 * counted, how much of it is Valence's own, how large the library it was made from is, and how much
 * the one adds to the other. Valence counts the disk on its own, so this says so rather than
 * offering a button to count it again.
 *
 * @param cache - What the monitor found on disk, or null while it is still counting.
 * @param artwork - How much artwork has been fetched and kept.
 * @param bookPages - How much the kept pages of books hold.
 * @param libraryBytes - How much the library itself holds, where that has been worked out.
 */
const StorageInfo = ({ cache, artwork, bookPages, libraryBytes }: StorageInfoProps) => {
  const now = useTicking(A_CAPTION_AGES_EVERY);
  const own = valenceOwnBytes(cache, artwork, bookPages);
  const countedAt = cache?.atMs ?? artwork?.atMs ?? null;
  const share =
    libraryBytes === null || libraryBytes === 0
      ? null
      : new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(
          own / libraryBytes,
        );

  return (
    <HoverCard
      side="bottom"
      align="end"
      isList
      detail={
        <>
          <InfoHeading>
            {countedAt === null
              ? say('screens.adminArea.cacheBreakdown.countingWhatIsOnTheDisk')
              : say('screens.adminArea.overviewPanel.storageInfo.countedWhen', {
                  value: describeSince(new Date(countedAt).toISOString(), now),
                })}
          </InfoHeading>

          <InfoRow label={say('screens.adminArea.overviewPanel.storageInfo.valencesOwnFiles')}>
            {formatBytes(own)}
          </InfoRow>

          {libraryBytes === null ? null : (
            <InfoRow label={say('common.theLibrary')}>{formatBytes(libraryBytes)}</InfoRow>
          )}

          {share === null ? null : (
            <InfoRow label={say('screens.adminArea.overviewPanel.storageInfo.addedOnTop')}>
              {say('screens.adminArea.overviewPanel.storageInfo.shareOfTheLibrary', { share })}
            </InfoRow>
          )}

          <InfoNote>{say('screens.adminArea.overviewPanel.storageInfo.countsItself')}</InfoNote>
        </>
      }
    >
      <Button
        variant="ghost"
        size="xs"
        isIconOnly
        label={say('screens.adminArea.overviewPanel.storageInfo.aboutTheStorage')}
        hasTooltip={false}
      >
        <Icon of={InfoIcon} size={15} />
      </Button>
    </HoverCard>
  );
};

StorageInfo.displayName = 'StorageInfo';

export { StorageInfo };

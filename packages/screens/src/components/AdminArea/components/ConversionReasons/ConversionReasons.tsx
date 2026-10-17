import { CircleCheck as CircleCheckIcon } from '@keyline-icons/react/fill';
import { BarList } from '@ValenceUI/BarList';
import { NothingHere } from '@ValenceUI/NothingHere';
import { REASON_NAMES } from '@ValenceScreens/admin/REASON_NAMES';
import { say } from '@ValenceI18n/say';
import type { ConversionReasonsProps } from './ConversionReasons.types';

/**
 * Why the server had to convert plays rather than send the file as it lies, most common first. The
 * conversions are what cost the machine, so these say which devices or files to look at.
 *
 * @param reasons - Each reason, and how many plays it applied to.
 */
const ConversionReasons = ({ reasons }: ConversionReasonsProps) =>
  reasons.length === 0 ? (
    <NothingHere
      isCompact
      of={CircleCheckIcon}
      title={say('screens.adminArea.playbackModeShare.everyPlayWentAsTheFileLies')}
    />
  ) : (
    <BarList
      label={say('screens.adminArea.playbackModeShare.whyPlaysWereConverted')}
      heading={say('screens.adminArea.playbackModeShare.whyItWasConverted')}
      valueHeading={say('screens.importWizard.importReportView.plays')}
      emptyMessage={say('screens.adminArea.playbackModeShare.everyPlayWentAsTheFileLies')}
      items={reasons.slice(0, 6).map((reason) => ({
        id: reason.code,
        label: REASON_NAMES[reason.code],
        value: reason.plays,
      }))}
    />
  );

ConversionReasons.displayName = 'ConversionReasons';

export { ConversionReasons };

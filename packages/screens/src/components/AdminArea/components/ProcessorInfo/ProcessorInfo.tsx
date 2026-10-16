import { InfoNote } from '@ValenceUI/InfoNote';
import { InfoRow } from '@ValenceUI/InfoRow';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { CoreMap } from '@ValenceScreens/components/AdminArea/components/CoreMap/CoreMap';
import type { ProcessorInfoProps } from './ProcessorInfo.types';
import { say } from '@ValenceI18n/say';

/**
 * What the processor is: its model, how many cores and threads it has and how fast it runs, with
 * the cores drawn out beneath.
 *
 * @param hardware - What the machine is built from.
 * @param percents - How busy each logical processor is right now.
 * @param speedsMhz - What each logical processor is clocked at right now, empty where the platform
 *   only reports a fixed figure.
 */
const ProcessorInfo = ({ hardware, percents, speedsMhz }: ProcessorInfoProps) => {
  const { processor } = hardware;
  const currentMhz =
    speedsMhz.length === 0 ? null : speedsMhz.reduce((sum, mhz) => sum + mhz, 0) / speedsMhz.length;

  return (
    <>
      {processor === null ? null : (
        <>
          <InfoRow label={say('screens.adminArea.hardware.model')}>{processor.model}</InfoRow>

          {processor.cores === null ? null : (
            <InfoRow label={say('screens.adminArea.hardware.cores')}>
              <FormattedNumber value={processor.cores} />
            </InfoRow>
          )}

          <InfoRow label={say('screens.adminArea.hardware.threads')}>
            <FormattedNumber value={processor.threads} />
          </InfoRow>

          {processor.speedMhz === null ? null : (
            <InfoRow label={say('screens.adminArea.hardware.topSpeed')}>
              {say('screens.adminArea.hardware.gigahertz', {
                speed: (processor.speedMhz / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                }),
              })}
            </InfoRow>
          )}

          {currentMhz === null ? null : (
            <InfoRow label={say('screens.adminArea.hardware.currentSpeed')}>
              {say('screens.adminArea.hardware.gigahertz', {
                speed: (currentMhz / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                }),
              })}
            </InfoRow>
          )}

          <CoreMap
            cores={processor.cores}
            threads={processor.threads}
            groups={processor.groups}
            percents={percents}
          />
        </>
      )}

      {hardware.surroundings === 'virtualMachine' ? (
        <InfoNote>{say('screens.adminArea.hardware.insideAVirtualMachine')}</InfoNote>
      ) : null}
    </>
  );
};

ProcessorInfo.displayName = 'ProcessorInfo';

export { ProcessorInfo };

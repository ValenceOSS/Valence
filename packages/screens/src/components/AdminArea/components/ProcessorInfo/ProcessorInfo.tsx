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
 */
const ProcessorInfo = ({ hardware }: ProcessorInfoProps) => {
  const { processor } = hardware;

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
            <InfoRow label={say('common.speed')}>
              {say('screens.adminArea.hardware.gigahertz', {
                speed: (processor.speedMhz / 1000).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                }),
              })}
            </InfoRow>
          )}

          <CoreMap cores={processor.cores} threads={processor.threads} />
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

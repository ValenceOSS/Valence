import { Fragment } from 'react';
import { InfoNote } from '@ValenceUI/InfoNote';
import { InfoRow } from '@ValenceUI/InfoRow';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import type { MemoryInfoProps } from './MemoryInfo.types';
import { say } from '@ValenceI18n/say';

/**
 * What the memory is: how much there is, and each stick in it — its size, generation, speed and
 * maker — where the machine would say.
 *
 * @param hardware - What the machine is built from.
 */
const MemoryInfo = ({ hardware }: MemoryInfoProps) => {
  const { memory, surroundings } = hardware;

  return (
    <>
      <InfoRow label={say('screens.adminArea.hardware.capacity')}>
        <FormattedBytes bytes={memory.totalBytes} />
      </InfoRow>

      {memory.modules.map((module, index) => {
        const parts = [
          module.sizeBytes === null ? null : <FormattedBytes key="size" bytes={module.sizeBytes} />,
          module.kind,
          module.speedMts === null
            ? null
            : say('screens.adminArea.hardware.megatransfers', {
                speed: module.speedMts.toLocaleString(),
              }),
          module.manufacturer,
        ].filter((part) => part !== null);

        return (
          <InfoRow
            key={`${module.slot ?? ''}-${index.toString()}`}
            label={module.slot ?? say('screens.adminArea.memory')}
          >
            <span className="inline-flex items-center gap-1.5">
              {parts.map((part, at) => (
                <Fragment key={at}>
                  {at === 0 ? null : (
                    <span aria-hidden className="size-1 rounded-full bg-text-muted" />
                  )}
                  <span>{part}</span>
                </Fragment>
              ))}
            </span>
          </InfoRow>
        );
      })}

      {memory.modules.length === 0 && surroundings === 'container' ? (
        <InfoNote>{say('screens.adminArea.hardware.sticksNeedPrivileges')}</InfoNote>
      ) : null}

      {surroundings === 'virtualMachine' ? (
        <InfoNote>{say('screens.adminArea.hardware.insideAVirtualMachine')}</InfoNote>
      ) : null}
    </>
  );
};

MemoryInfo.displayName = 'MemoryInfo';

export { MemoryInfo };

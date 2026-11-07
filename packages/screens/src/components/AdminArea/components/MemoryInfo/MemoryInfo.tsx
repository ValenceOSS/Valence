import { MemoryStick as MemoryIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import { InfoNote } from '@ValenceUI/InfoNote';
import { InfoRow } from '@ValenceUI/InfoRow';
import { FormattedBytes } from '@ValenceScreens/components/FormattedBytes/FormattedBytes';
import type { MemoryInfoProps } from './MemoryInfo.types';
import { say } from '@ValenceI18n/say';

/**
 * What the memory is: how much there is, how many of its slots are used, each empty slot dimmed,
 * and each stick in it — its size, generation, speed and
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

      {memory.emptySlots.length === 0 ? null : (
        <InfoRow label={say('screens.adminArea.hardware.slots')}>
          {say('screens.adminArea.hardware.usedOfSlots', {
            used: memory.modules.length.toLocaleString(),
            total: (memory.modules.length + memory.emptySlots.length).toLocaleString(),
          })}
        </InfoRow>
      )}

      {memory.modules.length + memory.emptySlots.length === 0 ? null : (
        <ul className="flex flex-col">
          {memory.modules.map((module, index) => {
            const name = [module.manufacturer, module.kind].filter((part) => part !== null);
            const details = [
              module.slot,
              module.speedMts === null
                ? null
                : say('screens.adminArea.hardware.megatransfers', {
                    speed: module.speedMts.toLocaleString(),
                  }),
            ].filter((part) => part !== null);

            return (
              <li
                key={`${module.slot ?? ''}-${index.toString()}`}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5"
              >
                <Icon of={MemoryIcon} size={16} tone="muted" className="shrink-0" />

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-text">
                    {name.length === 0 ? say('screens.adminArea.memory') : name.join(' ')}
                  </span>

                  {details.length === 0 ? null : (
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
                      {details.map((part, at) => (
                        <span key={part} className="inline-flex min-w-0 items-center gap-1.5">
                          {at === 0 ? null : (
                            <span aria-hidden className="size-1 shrink-0 rounded-full bg-current" />
                          )}
                          <span className="truncate">{part}</span>
                        </span>
                      ))}
                    </span>
                  )}
                </span>

                {module.sizeBytes === null ? null : (
                  <span className="shrink-0 font-medium tabular-nums text-text">
                    <FormattedBytes bytes={module.sizeBytes} />
                  </span>
                )}
              </li>
            );
          })}

          {memory.emptySlots.map((slot) => (
            <li
              key={slot}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 opacity-50"
            >
              <Icon of={MemoryIcon} size={16} tone="muted" className="shrink-0" />

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium text-text-muted">
                  {say('screens.adminArea.hardware.emptySlot')}
                </span>
                <span className="truncate text-xs text-text-muted">{slot}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

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

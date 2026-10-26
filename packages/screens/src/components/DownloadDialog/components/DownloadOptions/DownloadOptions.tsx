import { TriangleAlert as TriangleAlertIcon } from '@keyline-icons/react';
import { Callout } from '@ValenceUI/Callout';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { judgeFreeSpace } from '@ValenceCore/functions/judgeFreeSpace';
import { say } from '@ValenceI18n/say';
import type { DownloadOptionsProps } from './DownloadOptions.types';

/**
 * The sizes a download can be made in, what each costs, and whether the chosen one fits on this
 * device.
 *
 * @param options - What the server offered.
 * @param chosen - The size somebody chose, or nothing for the first on offer.
 * @param onChoose - Told when a size is chosen.
 * @param isOfASeries - Whether the sizes are for a whole programme, and so only about.
 * @param freeBytes - How much room this device has, where it is known.
 */
const DownloadOptions = ({
  options,
  chosen,
  onChoose,
  isOfASeries,
  freeBytes,
}: DownloadOptionsProps) => {
  const picked = options.find((one) => one.quality === chosen) ?? options[0] ?? null;
  const verdict = judgeFreeSpace({ bytes: picked?.bytes ?? null, freeBytes });

  return (
    <>
      <ChoiceList
        label={say('screens.downloadDialog.howLargeToMakeIt')}
        value={picked?.quality ?? null}
        onChoose={(id) => {
          const found = options.find((option) => option.quality === id);

          if (found !== undefined) {
            onChoose(found.quality);
          }
        }}
        choices={options.map((option) => ({
          id: option.quality,
          title: option.label,
          detail: option.meaning,
          ...(option.wouldTranscode ? { note: say('screens.downloadDialog.converted') } : {}),
          isDisabled: !option.savesSpace,
          aside: (
            <span className="flex max-w-40 flex-col items-end gap-0.5">
              <span className="text-sm font-semibold tabular-nums text-text">
                {option.bytes === null
                  ? say('screens.downloadDialog.sizeUnknown')
                  : isOfASeries
                    ? say('screens.downloadDialog.aboutSize', { size: formatBytes(option.bytes) })
                    : formatBytes(option.bytes)}
              </span>

              {option.comparison === null ? null : (
                <span className="text-xs text-text-muted">{option.comparison}</span>
              )}
            </span>
          ),
        }))}
      />

      {verdict === 'unknown' ? null : verdict === 'fits' ? (
        <p className="mt-4 font-body text-sm text-text-muted">
          {say('screens.downloadDialog.valueAndThisDeviceHasValue2', {
            value: formatBytes(picked?.bytes ?? 0),
            value2: formatBytes(freeBytes ?? 0),
          })}
        </p>
      ) : (
        <Callout
          className="mt-4"
          tone={verdict === 'willNotFit' ? 'danger' : 'warning'}
          icon={TriangleAlertIcon}
          title={
            verdict === 'willNotFit'
              ? say('screens.downloadDialog.thatWillNotFit')
              : say('screens.downloadDialog.thatIsMostOfWhatIs')
          }
        >
          {verdict === 'willNotFit'
            ? say('screens.downloadDialog.itNeedsValueAndThisDevice', {
                value: formatBytes(picked?.bytes ?? 0),
                value2: formatBytes(freeBytes ?? 0),
              })
            : say('screens.downloadDialog.valueOfTheValue2FreeOn', {
                value: formatBytes(picked?.bytes ?? 0),
                value2: formatBytes(freeBytes ?? 0),
              })}
        </Callout>
      )}
    </>
  );
};

DownloadOptions.displayName = 'DownloadOptions';

export { DownloadOptions };

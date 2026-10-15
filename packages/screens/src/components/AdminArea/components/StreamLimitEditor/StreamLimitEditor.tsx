import { KBPS_IN_A_MBPS } from '@ValenceCore/tokens/KBPS_IN_A_MBPS';
import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import type { StreamLimitEditorProps } from './StreamLimitEditor.types';
import { say } from '@ValenceI18n/say';

/**
 * Reads what was typed into a limit's field as a whole number above nothing, or as no limit at all
 * where it was left empty.
 *
 * @param typed - What was typed.
 * @param scale - What a typed unit is worth in the stored one.
 * @returns The limit, null for none, or undefined where what was typed is not a limit.
 */
const limitOf = (typed: string, scale = 1): number | null | undefined => {
  if (typed.trim() === '') {
    return null;
  }

  const read = Math.round(Number(typed) * scale);

  return Number.isFinite(read) && read > 0 ? read : undefined;
};

/**
 * The fields of a limit, filled from what is saved.
 *
 * @param own - What is saved.
 * @returns What each field holds.
 */
const fieldsOf = (own: StreamLimit | undefined) => ({
  bitrate:
    own === undefined || own.maxBitrateKbps === null
      ? ''
      : (own.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
  streams: own === undefined || own.maxStreams === null ? '' : own.maxStreams.toString(),
});

/**
 * The highest bitrate something may stream at and how many streams it may have at once, either left
 * empty for no limit, with whatever the caller has to say about it beneath — an account's streams
 * now, or what its roles hold it to.
 *
 * @param own - The limit as it is saved.
 * @param onSave - Told the limit to save, answering whether it was.
 * @param children - What to say beneath the fields.
 */
const StreamLimitEditor = ({ own, onSave, children }: StreamLimitEditorProps) => {
  const [typed, setTyped] = useState<{ bitrate: string; streams: string } | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const shown = typed ?? fieldsOf(own);
  const bitrate = limitOf(shown.bitrate, KBPS_IN_A_MBPS);
  const streams = limitOf(shown.streams);

  return (
    <div className="flex flex-col gap-4">
      <TextField
        label={say('screens.adminArea.accountStreamLimits.highestBitrate')}
        description={say('screens.adminArea.accountStreamLimits.highestBitrateDetail')}
        type="number"
        min={0.25}
        size="sm"
        value={shown.bitrate}
        placeholder={say('common.noLimit')}
        {...(bitrate === undefined
          ? { error: say('screens.adminArea.accountStreamLimits.notALimit') }
          : {})}
        onValueChange={(next) => {
          setTyped({ ...shown, bitrate: next });
        }}
      />

      <TextField
        label={say('screens.adminArea.accountStreamLimits.streamsAtOnce')}
        description={say('screens.adminArea.accountStreamLimits.streamsAtOnceDetail')}
        type="number"
        min={1}
        size="sm"
        value={shown.streams}
        placeholder={say('common.noLimit')}
        {...(streams === undefined
          ? { error: say('screens.adminArea.accountStreamLimits.notALimit') }
          : {})}
        onValueChange={(next) => {
          setTyped({ ...shown, streams: next });
        }}
      />

      {children}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={typed === null || bitrate === undefined || streams === undefined}
          onClick={() => {
            if (bitrate === undefined || streams === undefined) {
              return;
            }

            void onSave({ maxBitrateKbps: bitrate, maxStreams: streams }).then((saved) => {
              setSaid(
                saved
                  ? say('screens.adminArea.accountStreamLimits.saved')
                  : say('screens.adminArea.accountStreamLimits.couldNotSave'),
              );

              if (saved) {
                setTyped(null);
              }
            });
          }}
        >
          {say('common.save')}
        </Button>

        {said === null ? null : (
          <p role="status" className="text-sm text-text-muted">
            {said}
          </p>
        )}
      </div>
    </div>
  );
};

StreamLimitEditor.displayName = 'StreamLimitEditor';

export { StreamLimitEditor };

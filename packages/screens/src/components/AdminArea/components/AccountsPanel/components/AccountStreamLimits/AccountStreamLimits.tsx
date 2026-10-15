import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { TextField } from '@ValenceUI/TextField';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { accountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import { saveAccountStreamLimit } from '@ValenceClient/admin/saveAccountStreamLimit';
import type { AccountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import type { AccountStreamLimitsProps } from './AccountStreamLimits.types';
import { say } from '@ValenceI18n/say';

const KBPS_IN_A_MBPS = 1000;

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
 * The fields of one account's streaming limits, filled from what is saved.
 *
 * @param held - What is saved.
 * @returns What each field holds.
 */
const fieldsOf = (held: AccountStreamLimit | undefined) => ({
  bitrate:
    held?.own.maxBitrateKbps === null || held === undefined
      ? ''
      : (held.own.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
  streams:
    held?.own.maxStreams === null || held === undefined ? '' : held.own.maxStreams.toString(),
});

/**
 * The highest bitrate an account may stream at and how many streams it may have at once, with how
 * many it has running now, and where its roles hold it to less than its own limit, by how much.
 *
 * @param accountId - The account.
 */
const AccountStreamLimits = ({ accountId }: AccountStreamLimitsProps) => {
  const cache = useQueryClient();
  const key = ['admin', 'streamLimit', accountId];
  const held = useQuery({ queryKey: key, queryFn: () => accountStreamLimit(accountId) });
  const [typed, setTyped] = useState<{ bitrate: string; streams: string } | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const shown = typed ?? fieldsOf(held.data);
  const bitrate = limitOf(shown.bitrate, KBPS_IN_A_MBPS);
  const streams = limitOf(shown.streams);

  if (held.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.accountStreamLimits.couldNotRead')}
        isTryingAgain={held.isFetching}
        onTryAgain={() => {
          void held.refetch();
        }}
      />
    );
  }

  const effective = held.data?.effective;

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

      {held.data === undefined ? null : (
        <ul className="flex flex-col gap-1 text-sm text-text-muted">
          <li>
            {say('screens.adminArea.accountStreamLimits.streamingNow', {
              count: held.data.streamsNow.toString(),
            })}
          </li>
          {effective === undefined ||
          effective.maxBitrateKbps === null ||
          effective.maxBitrateKbps === held.data.own.maxBitrateKbps ? null : (
            <li>
              {say('screens.adminArea.accountStreamLimits.rolesHoldTheBitrate', {
                mbps: (effective.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
              })}
            </li>
          )}
          {effective === undefined ||
          effective.maxStreams === null ||
          effective.maxStreams === held.data.own.maxStreams ? null : (
            <li>
              {say('screens.adminArea.accountStreamLimits.rolesHoldTheStreams', {
                count: effective.maxStreams.toString(),
              })}
            </li>
          )}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={typed === null || bitrate === undefined || streams === undefined}
          onClick={() => {
            if (bitrate === undefined || streams === undefined) {
              return;
            }

            void saveAccountStreamLimit(accountId, {
              maxBitrateKbps: bitrate,
              maxStreams: streams,
            }).then((saved) => {
              if (saved === null) {
                setSaid(say('screens.adminArea.accountStreamLimits.couldNotSave'));

                return;
              }

              cache.setQueryData(key, saved);
              setTyped(null);
              setSaid(say('screens.adminArea.accountStreamLimits.saved'));
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

AccountStreamLimits.displayName = 'AccountStreamLimits';

export { AccountStreamLimits };

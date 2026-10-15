import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { accountStreamLimit } from '@ValenceClient/admin/accountStreamLimit';
import { saveAccountStreamLimit } from '@ValenceClient/admin/saveAccountStreamLimit';
import { StreamLimitEditor } from '@ValenceScreens/components/AdminArea/components/StreamLimitEditor/StreamLimitEditor';
import type { AccountStreamLimitsProps } from './AccountStreamLimits.types';
import { say } from '@ValenceI18n/say';

const KBPS_IN_A_MBPS = 1000;

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

  const own = held.data?.own;
  const effective = held.data?.effective;

  return (
    <StreamLimitEditor
      own={own}
      onSave={async (limit) => {
        const saved = await saveAccountStreamLimit(accountId, limit);

        if (saved !== null) {
          cache.setQueryData(key, saved);
        }

        return saved !== null;
      }}
    >
      {held.data === undefined ? null : (
        <ul className="flex flex-col gap-1 text-sm text-text-muted">
          <li>
            {say('screens.adminArea.accountStreamLimits.streamingNow', {
              count: held.data.streamsNow.toString(),
            })}
          </li>
          {effective === undefined ||
          effective.maxBitrateKbps === null ||
          effective.maxBitrateKbps === own?.maxBitrateKbps ? null : (
            <li>
              {say('screens.adminArea.accountStreamLimits.rolesHoldTheBitrate', {
                mbps: (effective.maxBitrateKbps / KBPS_IN_A_MBPS).toString(),
              })}
            </li>
          )}
          {effective === undefined ||
          effective.maxStreams === null ||
          effective.maxStreams === own?.maxStreams ? null : (
            <li>
              {say('screens.adminArea.accountStreamLimits.rolesHoldTheStreams', {
                count: effective.maxStreams.toString(),
              })}
            </li>
          )}
        </ul>
      )}
    </StreamLimitEditor>
  );
};

AccountStreamLimits.displayName = 'AccountStreamLimits';

export { AccountStreamLimits };

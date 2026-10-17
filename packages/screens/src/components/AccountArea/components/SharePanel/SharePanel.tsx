import { shareColumns } from '@ValenceScreens/sharing/shareColumns';
import { PanelCard } from '@ValenceUI/PanelCard';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Spinner } from '@ValenceUI/Spinner';
import { revokeShare } from '@ValenceClient/sharing/fetchShares';
import { shareQueries } from '@ValenceClient/query/shareQueries';
import type { Share } from '@ValenceContracts/schemas/Share';
import { say } from '@ValenceI18n/say';

/**
 * The links this account has handed out: what each points at, when it was made, what will end it,
 * how far through its allowance it is, and a way to withdraw it.
 *
 * A withdrawn link stays in the list rather than disappearing. Somebody who has just withdrawn one
 * wants to see that it happened, and a link that ended on its own is the same kind of fact.
 */
const SharePanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(shareQueries.mine());
  const [withdrawing, setWithdrawing] = useState<Share | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const columns = useMemo(() => shareColumns<Share>(setWithdrawing), []);

  return (
    <PanelCard title={say('screens.accountArea.sharePanel.yourLinks')} isFlush>
      <ConfirmDialog
        title={say('common.withdrawThisLink')}
        detail={
          withdrawing === null
            ? ''
            : say('screens.accountArea.sharePanel.theLinkToTitleStopsWorking', {
                title: withdrawing.title,
              })
        }
        confirmLabel={say('common.withdrawIt')}
        isDestructive
        isBusy={isWorking}
        isOpen={withdrawing !== null}
        onClose={() => {
          setWithdrawing(null);
        }}
        onConfirm={() => {
          const share = withdrawing;

          if (share === null) {
            return;
          }

          setIsWorking(true);

          void revokeShare(share.id)
            .then(async () => cache.invalidateQueries({ queryKey: shareQueries.key }))
            .finally(() => {
              setIsWorking(false);
              setWithdrawing(null);
            });
        }}
      />

      <p className="px-4 pt-4 text-sm text-text-muted">
        {say('screens.accountArea.sharePanel.anybodyHoldingOneOfTheseCan')}
      </p>

      {asked.isError ? (
        <CouldNotRead
          said={say('common.yourLinksCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          label={say('screens.accountArea.sharePanel.readingYourLinks')}
          size="sm"
        />
      ) : (
        <DataTable
          label={say('screens.accountArea.sharePanel.yourLinks')}
          columns={columns}
          rows={asked.data}
          emptyMessage={say('screens.accountArea.sharePanel.youHaveNotHandedOutAny')}
        />
      )}
    </PanelCard>
  );
};

SharePanel.displayName = 'SharePanel';

export { SharePanel };

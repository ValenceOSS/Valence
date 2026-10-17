import { shareColumns } from '@ValenceScreens/sharing/shareColumns';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { nameOfAsker } from '@ValenceContracts/functions/nameOfAsker';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { failureOfAnswer } from '@ValenceScreens/admin/failureOf';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { DataTable } from '@ValenceUI/DataTable';
import { Spinner } from '@ValenceUI/Spinner';
import { revokeAnybodysShare } from '@ValenceClient/sharing/fetchShares';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import type { AdminShare } from '@ValenceContracts/schemas/Share';
import { PanelCard } from '@ValenceUI/PanelCard';
import { say } from '@ValenceI18n/say';

/**
 * Every link this server has handed out, whoever handed it out: what each points at, who made it,
 * what will end it, how far through its allowance it is, and a way to withdraw it.
 *
 * Withdrawing somebody else's link tells them it happened and who did it. That is deliberate — a
 * link disappearing without a word is the kind of silent act that makes a shared server feel
 * arbitrary, and whoever made it is the one who has to explain to the person holding it.
 */
const SharesPanel = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.shares());
  const [withdrawing, setWithdrawing] = useState<AdminShare | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const columns = useMemo(
    () =>
      shareColumns<AdminShare>(setWithdrawing, [
        {
          id: 'createdBy',
          meta: { hidesOnPhones: true },
          header: say('screens.adminArea.sharesPanel.handedOutBy'),
          accessorFn: (share) =>
            nameOfAsker({
              profileName: share.createdByProfileName,
              household: share.createdByName,
            }),
          cell: ({ row }) => (
            <span className="truncate text-sm text-text">
              {nameOfAsker({
                profileName: row.original.createdByProfileName,
                household: row.original.createdByName,
              })}
            </span>
          ),
        },
      ]),
    [],
  );

  return (
    <PanelCard
      title={say('common.sharedLinks')}
      isFlush
      actions={
        <PanelCardInfo
          label={say('screens.adminArea.sharesPanel.aboutSharedLinks')}
          detail={say('screens.adminArea.sharesPanel.anybodyHoldingOneOfTheseCan')}
        />
      }
    >
      <ConfirmDialog
        title={say('common.withdrawThisLink')}
        detail={
          withdrawing === null
            ? ''
            : say('screens.adminArea.sharesPanel.createdByNameSLinkToTitleStops', {
                createdByName: nameOfAsker({
                  profileName: withdrawing.createdByProfileName,
                  household: withdrawing.createdByName,
                }),
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

          void revokeAnybodysShare(share.id)
            .then(async (revoked) => {
              tellOutcome(
                say('screens.adminArea.sharesPanel.withdrewTheLink'),
                failureOfAnswer(revoked, say('common.thatLinkCouldNotBeWithdrawn')),
              );

              return cache.invalidateQueries({ queryKey: adminQueries.shares().queryKey });
            })
            .finally(() => {
              setIsWorking(false);
              setWithdrawing(null);
            });
        }}
      />

      {asked.isError ? (
        <CouldNotRead
          said={say('screens.adminArea.sharesPanel.theLinksCouldNotBeRead')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      ) : asked.isPending ? (
        <Spinner
          isCentered
          label={say('screens.adminArea.sharesPanel.readingTheLinks')}
          size="sm"
        />
      ) : (
        <DataTable
          height="fills"
          label={say('common.sharedLinks')}
          columns={columns}
          rows={asked.data}
          emptyMessage={say('screens.adminArea.sharesPanel.nobodyHasHandedOutALink')}
        />
      )}
    </PanelCard>
  );
};

SharesPanel.displayName = 'SharesPanel';

export { SharesPanel };

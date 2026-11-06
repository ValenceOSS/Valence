import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ConfirmDialog } from '@ValenceUI/ConfirmDialog';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SelectField } from '@ValenceUI/SelectField';
import { notify } from '@ValenceUI/notify';
import { chooseEpisodeOrder } from '@ValenceClient/admin/chooseEpisodeOrder';
import { fetchEpisodeOrders } from '@ValenceClient/admin/fetchEpisodeOrders';
import type { EpisodeOrderPickerProps } from './EpisodeOrderPicker.types';
import { say } from '@ValenceI18n/say';

const OWN = 'tmdb';

/**
 * Chooses which of TMDB's orders a show's episodes are numbered in, such as its DVD order or
 * absolute numbering, asking first since every episode is read again by it. Shows nothing for a
 * show TMDB has only its own order for.
 *
 * @param mediaId - Any file of the show.
 * @param onChanged - Told the job reading the episodes again.
 */
const EpisodeOrderPicker = ({ mediaId, onChanged }: EpisodeOrderPickerProps) => {
  const cache = useQueryClient();
  const [asking, setAsking] = useState<{ id: string; name: string } | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const orders = useQuery({
    queryKey: ['episode-orders', mediaId],
    queryFn: () => fetchEpisodeOrders(mediaId),
    staleTime: 60_000,
  });

  if (orders.data === undefined || orders.data.orders.length === 0) {
    return null;
  }

  const options = [
    { id: OWN, label: say('screens.adminArea.episodeOrderPicker.tmdbsOwnOrder') },
    ...orders.data.orders.map((order) => ({ id: order.id, label: order.name })),
  ];

  const apply = async (order: string | null) => {
    setIsBusy(true);

    const answer = await chooseEpisodeOrder(mediaId, order);

    setIsBusy(false);
    setAsking(null);

    if (answer.kind === 'refused') {
      notify.failed(answer.reason);

      return;
    }

    await cache.invalidateQueries({ queryKey: ['episode-orders', mediaId] });
    onChanged(answer.jobId);
  };

  return (
    <PanelCard title={say('screens.adminArea.episodeOrderPicker.episodeOrder')}>
      <div className="flex flex-col gap-2">
        <p className="font-body text-xs text-text-muted">
          {say('screens.adminArea.episodeOrderPicker.whichOrderTheFilesFollow')}
        </p>
        <SelectField
          label={say('screens.adminArea.episodeOrderPicker.episodeOrder')}
          isLabelHidden
          size="sm"
          options={options}
          value={orders.data.chosen ?? OWN}
          onSelect={(id) => {
            const name = options.find((one) => one.id === id)?.label ?? id;

            if (id !== (orders.data.chosen ?? OWN)) {
              setAsking({ id, name });
            }
          }}
          className="max-w-xs"
        />
      </div>
      <ConfirmDialog
        title={say('screens.adminArea.episodeOrderPicker.numberByName', {
          order: asking?.name ?? '',
        })}
        detail={say('screens.adminArea.episodeOrderPicker.everyEpisodeIsReadAgain')}
        confirmLabel={say('screens.adminArea.episodeOrderPicker.useThisOrder')}
        isBusy={isBusy}
        isOpen={asking !== null}
        onClose={() => {
          setAsking(null);
        }}
        onConfirm={() => {
          if (asking !== null) {
            void apply(asking.id === OWN ? null : asking.id);
          }
        }}
      />
    </PanelCard>
  );
};

EpisodeOrderPicker.displayName = 'EpisodeOrderPicker';

export { EpisodeOrderPicker };

'use client';

import { BarList } from '@ValenceUI/BarList';
import { PanelCard } from '@ValenceUI/PanelCard';
import { formatShare } from '@ValenceMetrics/format/formatShare';
import type { ShareCardProps } from './ShareCard.types';

/**
 * One question about the servers that report, such as which database they run on, answered as
 * a ranked list of how many of them give each answer, as a share of all of them.
 *
 * @param title - The question.
 * @param heading - What the answers are, over the first column.
 * @param rows - The answers, in the order to list them.
 * @param note - A line beneath the list, such as why the shares add up to more than the whole.
 */
const ShareCard = ({ title, heading, rows, note }: ShareCardProps) => {
  const shareOf = new Map(rows.map(({ id, share }) => [id, share]));

  return (
    <PanelCard title={title} className="h-full">
      <div className="-mx-2 -my-1 flex flex-1 flex-col gap-3">
        <BarList
          items={rows.map(({ id, label, installs }) => ({ id, label, value: installs }))}
          label={title}
          heading={heading}
          valueHeading="Servers"
          emptyMessage="Not enough servers to show yet."
          figureOf={({ id }) => formatShare(shareOf.get(id) ?? 0)}
          fill="solid"
        />

        {note === undefined ? null : <p className="px-2 text-xs text-text-muted">{note}</p>}
      </div>
    </PanelCard>
  );
};

ShareCard.displayName = 'ShareCard';

export { ShareCard };

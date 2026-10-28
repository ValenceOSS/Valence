import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Star } from '@keyline-icons/react-native/fill';
import { ChannelLogo } from '@ValenceTv/components/ChannelLogo/ChannelLogo';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { giveFocusTo } from '@ValenceTv/navigation/giveFocusTo';
import { guideCellsOf } from '@ValenceClient/live/guideCellsOf';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { tokens } from '@ValenceTv/theme/tokens';
import { MINUTE_MS } from '@ValenceCore/tokens/MINUTE_MS';
import { GuideCell } from '@ValenceTv/screens/LiveGuide/components/GuideCell/GuideCell';
import type { View as ViewElement } from 'react-native';
import type { GuideCell as GuideCellShape } from '@ValenceClient/live/guideCellsOf';
import type { GuideRowProps } from './GuideRow.types';

const CHANNEL_WIDTH = 400;

const CELL_GAP = 8;

const LOGO = { width: 104, height: 64 };

const SHORTEST_GAP_MS = 2 * MINUTE_MS;

/**
 * What a cell is known by while the guide moves under it, so the one the remote is on is not drawn
 * again: its programme where it has one, and otherwise its start — or, for a gap at the start of the
 * row, the start of the row, which moves on with the stretch.
 *
 * @param cell - The cell.
 * @param from - Where the stretch starts, in milliseconds.
 * @returns Its key.
 */
const cellKeyOf = (cell: GuideCellShape, from: number): string =>
  cell.programme !== null
    ? `${cell.programme.startsAt}/${cell.programme.endsAt}`
    : cell.startsAt === from
      ? 'start'
      : String(cell.startsAt);

/**
 * One channel across the guide: its logo, number and name, a star where it is a favourite, and its
 * programmes laid across the stretch showing, each as wide as it runs. Where the guide has just
 * moved to another stretch, the remote is sent to whichever cell holds the time it was aimed at.
 *
 * @param channel - The channel.
 * @param programmes - Its programmes.
 * @param from - Where the stretch showing starts, in milliseconds.
 * @param until - Where it ends.
 * @param width - How wide the stretch is drawn.
 * @param now - The time now, which lights the programme on.
 * @param aimAt - A time in the stretch to send the remote to, once the row has drawn it.
 * @param onAimed - Told the remote has been sent.
 * @param onWatch - Told to watch the channel.
 * @param onKeep - Told to add the channel to favourites, or take it off.
 * @param onLand - Told the remote has come to one of the row's cells.
 * @param onLeave - Told the remote has left one of the row's cells.
 */
const GuideRowView = ({
  channel,
  programmes,
  from,
  until,
  width,
  now,
  aimAt,
  onAimed,
  onWatch,
  onKeep,
  onLand,
  onLeave,
}: GuideRowProps) => {
  const cells = useMemo(
    () => guideCellsOf(programmes, from, until, SHORTEST_GAP_MS),
    [programmes, from, until],
  );
  const elements = useRef(new Map<string, ViewElement>());
  const { name } = channelTagsOf(channel.name);
  const msWide = width / (until - from);

  useEffect(() => {
    if (aimAt === null) {
      return;
    }

    const aimed = cells.find((cell) => cell.startsAt <= aimAt && aimAt < cell.endsAt) ?? cells[0];

    giveFocusTo(
      aimed === undefined ? null : (elements.current.get(cellKeyOf(aimed, from)) ?? null),
    );
    onAimed();
  }, [aimAt, cells, from, onAimed]);

  const watch = useCallback(() => {
    onWatch(channel);
  }, [onWatch, channel]);
  const keep = useCallback(() => {
    onKeep(channel);
  }, [onKeep, channel]);
  const land = useCallback(
    (cell: GuideCellShape) => {
      onLand(channel, cell);
    },
    [onLand, channel],
  );
  const leave = useCallback(
    (cell: GuideCellShape) => {
      onLeave(channel, cell);
    },
    [onLeave, channel],
  );
  const hold = useCallback(
    (cell: GuideCellShape, element: ViewElement | null) => {
      if (element === null) {
        elements.current.delete(cellKeyOf(cell, from));
      } else {
        elements.current.set(cellKeyOf(cell, from), element);
      }
    },
    [from],
  );

  return (
    <View style={styles.row}>
      <View style={styles.channel}>
        <ChannelLogo
          channelId={channel.id}
          name={name}
          hasLogo={channel.hasLogo}
          width={LOGO.width}
          height={LOGO.height}
        />
        <View style={styles.naming}>
          {channel.number === null ? null : <Text style={styles.number}>{channel.number}</Text>}
          <Text numberOfLines={2} style={styles.name}>
            {name}
          </Text>
        </View>
        {channel.isFavourite ? <Icon of={Star} size={26} colour={tokens.colours.accent} /> : null}
      </View>

      <View style={styles.cells}>
        {cells.map((cell) => (
          <GuideCell
            key={cellKeyOf(cell, from)}
            cell={cell}
            channelName={name}
            left={(cell.startsAt - from) * msWide}
            width={Math.max((cell.endsAt - cell.startsAt) * msWide - CELL_GAP, 1)}
            isOnNow={cell.startsAt <= now && now < cell.endsAt}
            cellRef={hold}
            onWatch={watch}
            onKeep={keep}
            onFocus={land}
            onBlur={leave}
          />
        ))}
      </View>
    </View>
  );
};

const GuideRow = memo(GuideRowView);

GuideRow.displayName = 'GuideRow';

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', gap: CELL_GAP },
  channel: {
    width: CHANNEL_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingRight: tokens.space.sm,
  },
  naming: { flex: 1, gap: 2 },
  number: { color: tokens.colours.muted, fontSize: tokens.type.small - 2, fontWeight: '600' },
  name: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '600' },
  cells: { flex: 1 },
});

export { CHANNEL_WIDTH, CELL_GAP, GuideRow };

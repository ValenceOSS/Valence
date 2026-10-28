import { memo, useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';
import { tokens } from '@ValenceTv/theme/tokens';
import type { View as ViewElement } from 'react-native';
import type { GuideCellProps } from './GuideCell.types';
import { say } from '@ValenceI18n/say';

const WORDS_FIT_FROM = 96;

/**
 * One programme in the guide, or a stretch the guide says nothing about, as wide as it runs: its
 * title and when it starts, lit while it is on, and filled white where the remote rests on it.
 * Choosing it watches the channel; holding it adds the channel to favourites or takes it off.
 *
 * @param cell - The programme, cut to the stretch of the guide showing, or the gap.
 * @param channelName - The channel it is on, for a screen reader.
 * @param left - How far along the row it starts.
 * @param width - How wide it is drawn.
 * @param isOnNow - Whether it is on at this moment.
 * @param onWatch - Told to watch the channel.
 * @param onKeep - Told to add the channel to favourites, or take it off.
 * @param onFocus - Told the remote has come to it, and which cell it is.
 * @param onBlur - Told the remote has left it.
 * @param cellRef - Handed the drawn cell, for the guide to send the remote to it.
 */
const GuideCellView = ({
  cell,
  channelName,
  left,
  width,
  isOnNow,
  onWatch,
  onKeep,
  onFocus,
  onBlur,
  cellRef,
}: GuideCellProps) => {
  const title =
    cell.programme?.title ??
    (isOnNow ? say('screens.liveTvPage.liveNowNoGuide') : say('tv.liveGuide.noGuide'));
  const time = liveClockTime(cell.programme?.startsAt ?? new Date(cell.startsAt).toISOString());
  const focus = useCallback(() => {
    onFocus(cell);
  }, [onFocus, cell]);
  const blur = useCallback(() => {
    onBlur(cell);
  }, [onBlur, cell]);
  const hold = useCallback(
    (element: ViewElement | null) => {
      cellRef(cell, element);
    },
    [cellRef, cell],
  );

  return (
    <Focusable
      ref={hold}
      label={say('tv.liveGuide.channelTimeTitle', { channel: channelName, time, title })}
      scale={1}
      onPress={onWatch}
      onHold={onKeep}
      onFocus={focus}
      onBlur={blur}
      style={[styles.place, { left, width }]}
    >
      {(isFocused) => (
        <View
          style={[
            styles.cell,
            width >= WORDS_FIT_FROM && styles.roomy,
            isOnNow && styles.onNow,
            isFocused && styles.focused,
          ]}
        >
          {width < WORDS_FIT_FROM ? null : (
            <>
              <Text
                numberOfLines={1}
                style={[
                  styles.title,
                  cell.programme === null && styles.unknown,
                  isFocused && styles.ink,
                ]}
              >
                {title}
              </Text>
              {cell.programme === null ? null : (
                <Text numberOfLines={1} style={[styles.time, isFocused && styles.ink]}>
                  {time}
                </Text>
              )}
            </>
          )}
        </View>
      )}
    </Focusable>
  );
};

const GuideCell = memo(GuideCellView);

GuideCell.displayName = 'GuideCell';

const styles = StyleSheet.create({
  place: { position: 'absolute', top: 0, bottom: 0 },
  cell: {
    height: '100%',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colours.raised,
  },
  roomy: { paddingHorizontal: tokens.space.sm },
  onNow: { backgroundColor: tokens.colours.hover },
  focused: { backgroundColor: '#ffffff' },
  title: { color: tokens.colours.text, fontSize: tokens.type.small, fontWeight: '600' },
  unknown: { color: tokens.colours.muted, fontWeight: '400' },
  time: { color: tokens.colours.muted, fontSize: tokens.type.small - 4 },
  ink: { color: tokens.colours.onWhite },
});

export { GuideCell };

import { ChevronRight, Minus, Plus } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { APlayerList } from '@ValenceMobile/components/Watching/components/APlayerList/APlayerList';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { SUBTITLE_STEP_SECONDS } from '@ValenceClient/playback/SUBTITLE_STEP_SECONDS';
import { describeSubtitleOffset } from '@ValenceClient/playback/describeSubtitleOffset';
import type { TheAudioAndSubtitlesProps } from './TheAudioAndSubtitles.types';
import { say } from '@ValenceI18n/say';

const FURTHEST = 1.5;

const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: 'row', gap: 48, paddingLeft: '8%', paddingRight: '10%' },
  extra: {
    alignItems: 'center',
    borderTopColor: PLAYER_LOOK.colours.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingVertical: 14,
  },
  extraLabel: { ...PLAYER_LOOK.styles.label, flex: 1 },
  nudge: {
    alignItems: 'center',
    backgroundColor: PLAYER_LOOK.colours.chip,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  nudgeAt: { ...PLAYER_LOOK.styles.labelChosen, minWidth: 74, textAlign: 'center' },
  nothing: { ...PLAYER_LOOK.styles.label, paddingTop: 18 },
  only: { flex: 1 },
});

/**
 * The sound and the subtitles side by side, each a list with a tick against the one playing, the
 * way the big streaming players lay them out — because they are chosen together far more often
 * than apart: a film in another language, with the words underneath in this one.
 *
 * Under the subtitles, while a track is being read, its timing can be nudged earlier or later and
 * the way its words are drawn opened on its own.
 *
 * @param audio - The soundtracks, or none where there is only one to hear.
 * @param subtitles - The subtitle tracks and off, or none where there are none.
 * @param timing - How far the words are moved against the film, where a track is being read.
 * @param onStyle - Told they want to change how the words are drawn, where a track is being read.
 * @param onClose - Told they are done choosing.
 */
const TheAudioAndSubtitles = ({
  audio,
  subtitles,
  timing,
  onStyle,
  onClose,
}: TheAudioAndSubtitlesProps) => {
  const nudge = (by: number) => {
    if (timing !== null) {
      timing.onChange(Math.min(FURTHEST, Math.max(-FURTHEST, timing.offset + by)));
    }
  };

  return (
    <APlayerPanel label={say('phone.watching.closeAudioAndSubtitles')} onClose={onClose}>
      <View style={styles.columns}>
        {audio === null ? (
          <View style={styles.only}>
            <Text style={PLAYER_LOOK.styles.heading}>{say('common.audio')}</Text>
            <Text style={styles.nothing}>{say('phone.watching.theOneSoundtrack')}</Text>
          </View>
        ) : (
          <APlayerList set={audio} />
        )}

        {subtitles === null ? (
          <View style={styles.only}>
            <Text style={PLAYER_LOOK.styles.heading}>{say('common.subtitles')}</Text>
            <Text style={styles.nothing}>{say('phone.watching.noSubtitlesForThis')}</Text>
          </View>
        ) : (
          <APlayerList
            set={subtitles}
            footer={
              timing === null ? null : (
                <View>
                  <View style={styles.extra}>
                    <Text style={styles.extraLabel}>{say('common.subtitleTiming')}</Text>

                    <Button
                      tone="bare"
                      label={say('phone.watching.subtitlesEarlier')}
                      onPress={() => {
                        nudge(-SUBTITLE_STEP_SECONDS);
                      }}
                    >
                      <View style={styles.nudge}>
                        <Icon of={Minus} size={18} colour={PLAYER_LOOK.colours.text} />
                      </View>
                    </Button>

                    <Text style={styles.nudgeAt}>{describeSubtitleOffset(timing.offset)}</Text>

                    <Button
                      tone="bare"
                      label={say('phone.watching.subtitlesLater')}
                      onPress={() => {
                        nudge(SUBTITLE_STEP_SECONDS);
                      }}
                    >
                      <View style={styles.nudge}>
                        <Icon of={Plus} size={18} colour={PLAYER_LOOK.colours.text} />
                      </View>
                    </Button>
                  </View>

                  {onStyle === undefined ? null : (
                    <Button tone="bare" label={say('common.captionSettings')} onPress={onStyle}>
                      <View style={styles.extra}>
                        <Text style={styles.extraLabel}>{say('common.captionSettings')}</Text>
                        <Icon of={ChevronRight} size={20} colour={PLAYER_LOOK.colours.quiet} />
                      </View>
                    </Button>
                  )}
                </View>
              )
            }
          />
        )}
      </View>
    </APlayerPanel>
  );
};

TheAudioAndSubtitles.displayName = 'TheAudioAndSubtitles';

export { TheAudioAndSubtitles };

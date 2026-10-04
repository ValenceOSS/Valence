import { StyleSheet, View } from 'react-native';
import { Pause, Play, RotateCcw, RotateCw, Stop } from '@keyline-icons/react-native';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { APicture } from '@ValenceMobile/components/APicture/APicture';
import { ASheet } from '@ValenceMobile/components/ASheet/ASheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AVideoRemoteProps } from './AVideoRemote.types';
import { say } from '@ValenceI18n/say';

const BACK_BY = 10;

const ON_BY = 30;

const styles = StyleSheet.create({
  backdrop: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', width: '100%' },
  buttons: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'center' },
  ends: { flexDirection: 'row', gap: 10 },
  remote: { gap: 18 },
  times: { flexDirection: 'row', justifyContent: 'space-between' },
});

/**
 * The remote for a television this phone sent a film to, as the web's: what is playing and where,
 * a bar to move through it, back ten seconds, play or pause, on thirty, and either taking the film
 * back to play on the phone from where it got to, or stopping it.
 *
 * @param isOpen - Whether the remote is out.
 * @param onClose - Told to put the remote away.
 * @param onPlayHere - Told to play the film on this phone, from where the television had reached.
 */
const AVideoRemote = ({ isOpen, onClose, onPlayHere }: AVideoRemoteProps) => {
  const colours = useTheColours();
  const { device, watching, positionSeconds, send, release } = useVideoRemote();
  const isPlaying = watching?.isPlaying ?? false;
  const duration = watching?.durationSeconds ?? 0;

  return (
    <ASheet
      isOpen={isOpen && device !== null}
      title={watching?.title ?? say('common.starting')}
      onClose={onClose}
    >
      <View style={styles.remote}>
        {device === null ? null : (
          <Words tone="muted">
            {watching === null || watching.subtitle === null
              ? say('screens.videoRemoteBar.onLabel', { label: device.label })
              : say('screens.videoRemote.subtitleOnLabel', {
                  subtitle: watching.subtitle,
                  label: device.label,
                })}
          </Words>
        )}

        {watching !== null && watching.hasBackdrop ? (
          <View style={styles.backdrop}>
            <APicture
              picture={{
                uri: onThisServer(`/api/media/${watching.mediaId}/image/backdrop`),
                isDrawn: false,
              }}
              onMissing={() => undefined}
            />
          </View>
        ) : null}

        <View>
          <Slider
            label={say('screens.videoRemote.whereTheFilmIsUpTo')}
            value={positionSeconds}
            furthest={Math.max(duration, 1)}
            colour={colours.text}
            restColour={withAlpha(colours.text, 0.15)}
            aheadColour={withAlpha(colours.text, 0.15)}
            isDisabled={watching === null}
            onScrubbed={(seconds) => {
              send({ kind: 'seek', positionSeconds: Math.round(seconds) });
            }}
          />
          <View style={styles.times}>
            <Words size="small" tone="muted">
              {formatDuration(positionSeconds)}
            </Words>
            <Words size="small" tone="muted">
              -{formatDuration(Math.max(duration - positionSeconds, 0))}
            </Words>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            tone="ghost"
            icon={RotateCcw}
            label={say('screens.videoRemote.backBACKBYSeconds', { BACK_BY: BACK_BY.toString() })}
            isDisabled={watching === null}
            onPress={() => {
              send({ kind: 'skip', seconds: -BACK_BY });
            }}
          />
          <Button
            tone="bold"
            icon={isPlaying ? Pause : Play}
            label={isPlaying ? say('common.pause') : say('common.play')}
            isDisabled={watching === null}
            onPress={() => {
              send({ kind: isPlaying ? 'pause' : 'resume' });
            }}
          />
          <Button
            tone="ghost"
            icon={RotateCw}
            label={say('screens.videoRemote.onONBYSeconds', { ON_BY: ON_BY.toString() })}
            isDisabled={watching === null}
            onPress={() => {
              send({ kind: 'skip', seconds: ON_BY });
            }}
          />
        </View>

        <View style={styles.ends}>
          <Button
            tone="quiet"
            fills
            isDisabled={watching === null}
            onPress={() => {
              if (watching === null) {
                return;
              }

              send({ kind: 'stop' });
              release();
              onClose();
              onPlayHere(watching.mediaId, positionSeconds);
            }}
          >
            {say('common.playHere')}
          </Button>
          <Button
            tone="quiet"
            fills
            icon={Stop}
            isDestructive
            onPress={() => {
              send({ kind: 'stop' });
              release();
              onClose();
            }}
          >
            {say('common.stop')}
          </Button>
        </View>
      </View>
    </ASheet>
  );
};

AVideoRemote.displayName = 'AVideoRemote';

export { AVideoRemote };

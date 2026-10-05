import { StyleSheet, View } from 'react-native';
import { Monitor, Pause, Play } from '@keyline-icons/react-native';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AVideoRemoteBarProps } from './AVideoRemoteBar.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  bar: { alignItems: 'center', flexDirection: 'row', gap: 10, padding: 8 },
  opens: { flex: 1 },
  said: { flex: 1, gap: 1 },
  what: { alignItems: 'center', flexDirection: 'row', gap: 10 },
});

/**
 * A strip above the tabs while this phone is a television's remote, as the web shows one: what is
 * playing and on which television, opening the whole remote when pressed, with play and pause to
 * hand. Nothing is drawn while this phone controls nothing.
 *
 * @param onOpen - Told to open the whole remote.
 */
const AVideoRemoteBar = ({ onOpen }: AVideoRemoteBarProps) => {
  const colours = useTheColours();
  const { device, watching, send } = useVideoRemote();

  if (device === null) {
    return null;
  }

  const isPlaying = watching?.isPlaying ?? false;

  return (
    <View style={styles.bar}>
      <AGlass roundness={16} />

      <View style={styles.opens}>
        <Button
          tone="bare"
          label={say('screens.videoRemoteBar.openTheRemoteForLabel', { label: device.label })}
          onPress={onOpen}
        >
          <View style={styles.what}>
            <Icon of={Monitor} colour={colours.text} />
            <View style={styles.said}>
              <Words lines={1}>{watching?.title ?? say('common.starting')}</Words>
              <Words size="small" tone="muted" lines={1}>
                {say('screens.videoRemoteBar.onLabel', { label: device.label })}
              </Words>
            </View>
          </View>
        </Button>
      </View>
      <Button
        tone="ghost"
        icon={isPlaying ? Pause : Play}
        label={isPlaying ? say('common.pause') : say('common.play')}
        isDisabled={watching === null}
        onPress={() => {
          send({ kind: isPlaying ? 'pause' : 'resume' });
        }}
      />
    </View>
  );
};

AVideoRemoteBar.displayName = 'AVideoRemoteBar';

export { AVideoRemoteBar };

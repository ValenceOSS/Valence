import {
  Airplay,
  Bluetooth,
  ChevronRight,
  Laptop,
  Monitor,
  Smartphone,
} from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from 'react-native';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AirPlayButton } from '@ValenceMobile/components/AirPlayButton/AirPlayButton';
import { ABottomSheet } from '@ValenceMobile/components/ABottomSheet/ABottomSheet';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ClientKind } from '@ValenceContracts/schemas/ClientKind';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import type { ADevicesSheetProps } from './ADevicesSheet.types';
import { say } from '@ValenceI18n/say';

const TILE_HIGH = 76;

const styles = StyleSheet.create({
  current: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', gap: 16, padding: 20 },
  currentSaid: { flex: 1, gap: 6 },
  currentHeading: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  said: { flex: 1, gap: 2 },
  tile: {
    alignItems: 'center',
    borderRadius: 18,
    gap: 6,
    height: TILE_HIGH,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileWords: { alignItems: 'center', gap: 6, justifyContent: 'center' },
  whole: { gap: 18 },
});

/**
 * The icon for a kind of device.
 *
 * @param kind - What kind it is, where it has said.
 * @returns How it is drawn.
 */
const glyphOf = (kind: ClientKind | null): AGlyph =>
  kind === 'phone' ? Smartphone : kind === 'tv' ? Monitor : Laptop;

/**
 * Where the music plays, as the web's devices panel offers it, laid out as a music app's connect
 * sheet is: wherever it is playing now at the top, large, with what it is playing; every other
 * Valence this profile has open beneath it — a browser, the desktop app, a television, another
 * phone — each with what it is playing; and at the foot, the system's own way to a speaker, which
 * is AirPlay on an iPhone and Bluetooth on Android.
 *
 * Picking another device hands the music over, carrying on from the same moment in the same song
 * with the rest of the queue, and this phone becomes its remote; picking this phone brings the
 * music back here from where it had got to.
 *
 * @param isOpen - Whether it is out.
 * @param onClose - Told to put it away.
 */
const ADevicesSheet = ({ isOpen, onClose }: ADevicesSheetProps) => {
  const colours = useTheColours();
  const [tileWidth, setTileWidth] = useState(0);
  const { player, state } = useTheMusic();
  const shown = useWhatIsPlaying(state);
  const devices = useQuery({ ...musicQueries.devices(), enabled: isOpen });
  const here = platformInUse().thisClientId();
  const everyOther = (devices.data ?? []).filter((device) => device.clientId !== here);
  const playingOn = state.remote?.clientId ?? null;
  const remote = everyOther.find((device) => device.clientId === playingOn) ?? null;
  const others = everyOther.filter((device) => device.clientId !== playingOn);
  const thisPhone =
    Platform.OS === 'ios'
      ? say('phone.aDevicesSheet.thisIPhone')
      : say('phone.aDevicesSheet.thisPhone');
  const track = state.current;
  const nowPlaying =
    track === null
      ? null
      : `${track.title} — ${track.artists.map((artist) => artist.name).join(', ')}`;

  const bringItHere = () => {
    if (playingOn !== null) {
      player.playHere(shown?.positionSeconds ?? 0, shown?.isPlaying ?? true);
    }
  };

  return (
    <ABottomSheet isOpen={isOpen} label={say('common.playOn')} onClose={onClose}>
      <View style={styles.whole}>
        <View style={[styles.current, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
          <View style={styles.currentSaid}>
            <View style={styles.currentHeading}>
              <Words size="heading" isStrong lines={1}>
                {remote?.label ?? state.remote?.label ?? thisPhone}
              </Words>
              <Icon of={ChevronRight} size={18} colour={colours.textMuted} />
            </View>
            {nowPlaying === null ? null : (
              <Words size="small" tone="accent" lines={1}>
                {nowPlaying}
              </Words>
            )}
          </View>
          <Icon
            of={playingOn === null ? Smartphone : glyphOf(remote?.clientKind ?? null)}
            size={40}
            colour={colours.accent}
          />
        </View>

        {playingOn === null ? null : (
          <Button
            tone="bare"
            label={say('common.playOnLabel', { label: thisPhone })}
            onPress={() => {
              bringItHere();
              onClose();
            }}
          >
            <View style={styles.row}>
              <Icon of={Smartphone} size={26} colour={colours.text} />
              <View style={styles.said}>
                <Words lines={1}>{thisPhone}</Words>
              </View>
            </View>
          </Button>
        )}

        {others.map((device) => (
          <Button
            key={device.clientId}
            tone="bare"
            label={say('common.playOnLabel', { label: device.label })}
            onPress={() => {
              player.playOn({ clientId: device.clientId, label: device.label });
              onClose();
            }}
          >
            <View style={styles.row}>
              <Icon of={glyphOf(device.clientKind)} size={26} colour={colours.text} />
              <View style={styles.said}>
                <Words lines={1}>{device.label}</Words>
                <Words size="small" tone="muted" lines={1}>
                  {device.nowPlaying === null
                    ? say('common.notPlaying')
                    : `${device.nowPlaying.isPlaying ? say('common.playing') : say('common.pausedOn')} ${device.nowPlaying.title}`}
                </Words>
              </View>
            </View>
          </Button>
        ))}

        {devices.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}

        {!devices.isPending && everyOther.length === 0 ? (
          <Words tone="muted">{say('phone.aDevicesSheet.noOtherValenceIsOpenOn')}</Words>
        ) : null}

        {Platform.OS === 'ios' ? (
          <View
            style={[styles.tile, { backgroundColor: withAlpha(colours.text, 0.08) }]}
            onLayout={({ nativeEvent }) => {
              setTileWidth(nativeEvent.layout.width);
            }}
          >
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tileWords]}>
              <Icon of={Airplay} size={22} colour={colours.text} />
              <Words size="small">{say('phone.aDevicesSheet.airPlayAndBluetooth')}</Words>
            </View>
            <View style={[StyleSheet.absoluteFill, { opacity: 0.02 }]}>
              {tileWidth > 0 ? (
                <AirPlayButton fills={{ height: TILE_HIGH, width: tileWidth }} />
              ) : null}
            </View>
          </View>
        ) : (
          <Button
            tone="bare"
            label={say('phone.aDevicesSheet.bluetooth')}
            onPress={() => {
              void Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => undefined);
            }}
          >
            <View style={[styles.tile, { backgroundColor: withAlpha(colours.text, 0.08) }]}>
              <Icon of={Bluetooth} size={22} colour={colours.text} />
              <Words size="small">{say('phone.aDevicesSheet.bluetooth')}</Words>
            </View>
          </Button>
        )}
      </View>
    </ABottomSheet>
  );
};

ADevicesSheet.displayName = 'ADevicesSheet';

export { ADevicesSheet };

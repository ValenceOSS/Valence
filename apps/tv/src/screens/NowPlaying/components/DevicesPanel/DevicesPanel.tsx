import { ScrollView, StyleSheet, Text, TVFocusGuideView, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check, Laptop, Monitor, Smartphone } from '@keyline-icons/react-native';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { tokens } from '@ValenceTv/theme/tokens';
import { theKindOfTv } from '@ValenceTv/platform/theKindOfTv';
import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';
import type { DevicesPanelProps } from './DevicesPanel.types';

const WIDTH = 820;

/**
 * The picture that says what kind of device a name is, as the web picks it.
 *
 * @param label - What the device calls itself.
 * @returns The icon.
 */
const iconFor = (label: string): KeylineIcon => {
  const named = label.toLowerCase();

  if (/iphone|android|phone|pixel/.test(named)) {
    return Smartphone;
  }

  return /mac|laptop|book/.test(named) ? Laptop : Monitor;
};

/**
 * Every other open copy of Valence this person has, to hand the music to, in a panel down the
 * right of the screen as the web lists them. Choosing one sends it what is left of the queue from
 * where this television had got to, and the television goes quiet and becomes a remote for it;
 * choosing the television again takes the music back from wherever the other had reached.
 *
 * @param shown - What is playing, here or on the device being controlled.
 * @param onChosen - Told once a device has been chosen, to close the panel.
 */
const DevicesPanel = ({ shown, onChosen }: DevicesPanelProps) => {
  const { state, player } = useMusicPlayer(theMusicPlayer());
  const asked = useQuery(musicQueries.devices());
  const thisDevice = platformInUse().thisClientId();
  const others = (asked.data ?? []).filter((device) => device.clientId !== thisDevice);
  const { remote } = state;

  return (
    <TVFocusGuideView style={styles.panel} trapFocusLeft trapFocusRight trapFocusUp trapFocusDown>
      <FadeIn>
        <Text style={styles.title}>Play on</Text>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <ActionRow
            label={
              remote === null ? `This ${theKindOfTv()} · playing here` : `This ${theKindOfTv()}`
            }
            icon={remote === null ? Check : Monitor}
            hasPreferredFocus={remote === null}
            onPress={() => {
              if (remote !== null) {
                player.playHere(shown?.positionSeconds ?? 0, shown?.isPlaying ?? true);
              }

              onChosen();
            }}
          />

          <Text style={styles.heading}>Your other devices</Text>

          {others.length === 0 ? (
            <View style={styles.none}>
              <Text style={styles.empty}>
                Open Valence on another device, signed in as you, and it will be here.
              </Text>
            </View>
          ) : (
            others.map((device) => {
              const isChosen = remote?.clientId === device.clientId;
              const doing =
                device.nowPlaying === null
                  ? 'not playing'
                  : `${device.nowPlaying.isPlaying ? 'playing' : 'paused on'} ${device.nowPlaying.title}`;

              return (
                <ActionRow
                  key={device.clientId}
                  label={`${device.label} · ${isChosen ? 'controlling' : doing}`}
                  icon={isChosen ? Check : iconFor(device.label)}
                  hasPreferredFocus={isChosen}
                  onPress={() => {
                    if (!isChosen && (state.current !== null || device.nowPlaying !== null)) {
                      player.playOn({ clientId: device.clientId, label: device.label });
                    }

                    onChosen();
                  }}
                />
              );
            })
          )}
        </ScrollView>
      </FadeIn>
    </TVFocusGuideView>
  );
};

DevicesPanel.displayName = 'DevicesPanel';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  heading: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: tokens.space.lg,
    paddingHorizontal: tokens.space.md,
  },
  none: { paddingHorizontal: tokens.space.md },
  empty: { color: tokens.colours.muted, fontSize: tokens.type.body },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { DevicesPanel };

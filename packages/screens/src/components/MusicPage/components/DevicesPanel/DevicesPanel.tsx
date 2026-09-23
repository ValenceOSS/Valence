import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight as ChevronRightIcon,
  Laptop as LaptopIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import type { IconGlyph } from '@ValenceUI/Icon.types';

/**
 * Picks an icon for a device by what it calls itself.
 *
 * @param label - The device's name for itself.
 * @returns The icon.
 */
const iconFor = (label: string): IconGlyph => {
  const named = label.toLowerCase();

  if (/iphone|android|phone|pixel|galaxy/.test(named)) {
    return SmartphoneIcon;
  }

  if (/tv|television|chromecast|shield/.test(named)) {
    return MonitorIcon;
  }

  return /mac|laptop|book/.test(named) ? LaptopIcon : MonitorIcon;
};

/**
 * Every other open copy of Valence this person has, and the one to hand the music to.
 *
 * Choosing one sends it what is left of the queue from where this device had got to, and this
 * device goes quiet and becomes a remote for it. Choosing this device again takes the music back,
 * from wherever the other one had reached.
 */
const DevicesPanel = () => {
  const { state, player } = useMusicPlayer();
  const shown = useWhatIsPlaying(state);
  const asked = useQuery(musicQueries.devices());
  const thisDevice = platformInUse().thisClientId();
  const others = (asked.data ?? []).filter((device) => device.clientId !== thisDevice);
  const { remote } = state;
  const isHere = remote === null;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg p-3',
          isHere ? 'bg-hover font-semibold text-text' : 'text-text',
        )}
      >
        <Icon of={iconFor(platformInUse().describeThisClient())} size={22} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">This device</span>
          <span className="truncate text-xs text-text-muted">
            {isHere
              ? shown === null
                ? 'Ready to play'
                : 'Playing here'
              : `Controlling ${remote.label}`}
          </span>
        </span>
        {isHere ? null : (
          <Button
            variant="secondary"
            size="xs"
            onClick={() => {
              player.playHere(shown?.positionSeconds ?? 0, shown?.isPlaying ?? true);
            }}
          >
            Play here
          </Button>
        )}
      </div>

      <section aria-label="Your other devices" className="flex flex-col gap-1">
        <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
          Your other devices
        </h3>

        {others.length === 0 ? (
          <p className="px-1 text-sm text-text-muted">
            Open Valence on another device, signed in as you, and it will be here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {others.map((device) => {
              const isChosen = remote?.clientId === device.clientId;

              return (
                <li key={device.clientId}>
                  <Button
                    variant="bare"
                    size="none"
                    hasTooltip={false}
                    label={`Play on ${device.label}`}
                    disabled={state.current === null && device.nowPlaying === null}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-hover',
                      isChosen ? 'bg-hover font-semibold text-text' : 'text-text',
                    )}
                    onClick={() => {
                      if (!isChosen) {
                        player.playOn({ clientId: device.clientId, label: device.label });
                      }
                    }}
                  >
                    <Icon of={iconFor(device.label)} size={22} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold">{device.label}</span>
                      <span className="truncate text-xs text-text-muted">
                        {device.nowPlaying === null
                          ? 'Not playing'
                          : `${device.nowPlaying.isPlaying ? 'Playing' : 'Paused on'} ${device.nowPlaying.title}`}
                      </span>
                    </span>
                    <Icon of={ChevronRightIcon} size={16} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

DevicesPanel.displayName = 'DevicesPanel';

export { DevicesPanel, iconFor };

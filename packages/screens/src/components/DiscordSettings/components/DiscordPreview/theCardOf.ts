import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { DiscordActivity } from '@ValenceClient/discord/aDiscordActivity';
import type { DiscordStatusCardProps } from '@ValenceUI/DiscordStatusCard.types';
import { say } from '@ValenceI18n/say';

const LISTENING = 2;

const A_SECOND = 1000;

const AN_HOUR = 3600;

/**
 * A time the way Discord writes one: minutes always two figures, and hours only where there are
 * any, so seventeen seconds reads 00:17.
 *
 * @param seconds - The time in seconds.
 * @returns The clock.
 */
const aDiscordClock = (seconds: number): string =>
  seconds >= AN_HOUR ? formatDuration(seconds) : formatDuration(seconds).padStart(5, '0');

/**
 * What Discord's profile card draws for this status, as the card component takes it: "Watching
 * Valence" over the top, the same lines and pictures, and the time as a bar where there is an end or
 * a count where there is not, written as Discord writes it.
 *
 * @param activity - The status as Discord would be sent it.
 * @param now - The time now in milliseconds, which the time is counted from.
 * @returns The card's props.
 */
const theCardOf = (activity: DiscordActivity, now: number): DiscordStatusCardProps => {
  const { timestamps, assets } = activity;
  const elapsed = timestamps === undefined ? 0 : Math.max(now / A_SECOND - timestamps.start, 0);
  const total =
    timestamps?.end === undefined ? null : Math.max(timestamps.end - timestamps.start, 1);

  return {
    heading:
      activity.type === LISTENING
        ? say('screens.discordPreview.listeningToWhat', {
            what: activity.name ?? say('common.valence'),
          })
        : say('screens.discordPreview.watchingWhat', {
            what: activity.name ?? say('common.valence'),
          }),
    details: activity.details,
    ...(activity.state === undefined ? {} : { state: activity.state }),
    largeImage: assets.large_image,
    largeImageLabel: assets.large_text,
    ...(assets.small_image === undefined ? {} : { smallImage: assets.small_image }),
    ...(assets.small_text === undefined ? {} : { smallImageLabel: assets.small_text }),
    ...(timestamps === undefined
      ? {}
      : {
          time:
            total === null
              ? {
                  kind: 'elapsed' as const,
                  elapsed: say('screens.discordPreview.timeElapsed', {
                    time: aDiscordClock(elapsed),
                  }),
                }
              : {
                  kind: 'progress' as const,
                  elapsed: aDiscordClock(elapsed),
                  total: aDiscordClock(total),
                  fraction: elapsed / total,
                },
        }),
    buttons: (activity.buttons ?? []).map((button) => button.label),
  };
};

export { theCardOf };

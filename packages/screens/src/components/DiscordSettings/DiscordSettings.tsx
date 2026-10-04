import { useQuery } from '@tanstack/react-query';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Switch } from '@ValenceUI/Switch';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { DiscordPreview } from '@ValenceScreens/components/DiscordSettings/components/DiscordPreview/DiscordPreview';
import {
  DEFAULT_DISCORD_PRESENCE,
  DiscordPresenceSchema,
} from '@ValenceContracts/schemas/DiscordPresence';
import type { DiscordPresence } from '@ValenceContracts/schemas/DiscordPresence';
import type { DiscordSettingsProps } from './DiscordSettings.types';
import { say } from '@ValenceI18n/say';

const STATUS_CHOICES = [
  { id: 'valence', label: say('common.valence') },
  { id: 'title', label: say('common.title') },
] as const;

const LOGO_CHOICES = [
  { id: 'light', label: say('common.light') },
  { id: 'dark', label: say('common.dark') },
] as const;

const TIME_CHOICES = [
  { id: 'remaining', label: say('common.timeLeft') },
  { id: 'elapsed', label: say('screens.discordSettings.timeElapsed') },
] as const;

const HOW_IT_LOOKS = [
  {
    key: 'showsArtwork',
    title: say('common.artwork'),
    description: say('screens.discordSettings.showsThePosterOrAlbumCover'),
  },
  {
    key: 'showsWhilePaused',
    title: say('screens.discordSettings.whilePaused'),
    description: say('screens.discordSettings.keepsShowingWhatYouRePlaying'),
  },
  {
    key: 'showsBrowsing',
    title: say('screens.discordSettings.whileBrowsing'),
    description: say('screens.discordSettings.showsThatValenceIsOpenWhile'),
  },
  {
    key: 'showsTmdbLink',
    title: say('screens.discordSettings.tmdbButton'),
    description: say('screens.discordSettings.addsAButtonThatOpensThe'),
  },
  {
    key: 'showsPartySize',
    title: say('screens.discordSettings.watchPartySize'),
    description: say('screens.discordSettings.showsHowManyPeopleAreWatching'),
  },
] as const;

const WHAT_IS_SHOWN = [
  { key: 'sharesFilms', title: say('common.films') },
  { key: 'sharesShows', title: say('common.shows') },
  { key: 'sharesMusic', title: say('common.music') },
] as const;

/**
 * How somebody's status looks on Discord, and what may appear there at all, for the desktop app.
 *
 * The first switch is the one that was always there. Everything else waits behind it, because none
 * of it means anything while nothing is shown. Like the profile's other settings, every control
 * changes the draft, and the dialog's one button saves the lot.
 *
 * Only film and TV libraries are listed to keep off Discord: a track carries no library to check,
 * so music is kept off by its own switch instead.
 *
 * A preview above them shows the profile card the settings would make, before they are saved.
 *
 * @param draft - The profile as it would be saved, or nothing while it is being read.
 * @param onDraft - Told what somebody changed.
 */
const DiscordSettings = ({ draft, onDraft }: DiscordSettingsProps) => {
  const libraries = useQuery(libraryQueries.all());
  const presence = draft?.discordPresence ?? DEFAULT_DISCORD_PRESENCE;
  const isShown = draft?.showsWhatIamWatching ?? false;
  const watchable = (libraries.data ?? []).filter(
    (library) => library.kind === 'movies' || library.kind === 'shows',
  );

  const change = (part: Partial<DiscordPresence>) => {
    onDraft({ discordPresence: { ...presence, ...part } });
  };

  const flip = (key: (typeof HOW_IT_LOOKS | typeof WHAT_IS_SHOWN)[number]['key']) => {
    onDraft({
      discordPresence: DiscordPresenceSchema.parse({ ...presence, [key]: !presence[key] }),
    });
  };

  return (
    <>
      {!isShown ? null : <DiscordPreview settings={presence} />}

      <PanelCard title={say('screens.adminArea.webhookFields.discord')} isFlush>
        <SettingList isInset>
          <SettingRow
            title={say('screens.accountArea.profileSettings.showWhatIAmPlayingOn')}
            description={say('screens.accountArea.profileSettings.theTitleAndTheSeriesAnd')}
          >
            <Switch
              label={say('screens.accountArea.profileSettings.showWhatIAmPlayingOn')}
              isLabelHidden
              isOn={isShown}
              disabled={draft === null}
              onToggle={() => {
                onDraft({ showsWhatIamWatching: !isShown });
              }}
            />
          </SettingRow>

          {!isShown ? null : (
            <>
              <SettingRow
                title={say('common.status')}
                description={say('screens.discordSettings.showsValenceOrTheTitleOf')}
              >
                <SegmentedRow
                  size="sm"
                  tone="accent"
                  label={say('common.status')}
                  items={STATUS_CHOICES}
                  value={presence.statusShows}
                  onSelect={(chosen) => {
                    change({
                      statusShows: DiscordPresenceSchema.shape.statusShows.parse(chosen),
                    });
                  }}
                />
              </SettingRow>

              <SettingRow
                title={say('screens.adminArea.artworkPicker.logo')}
                description={say('screens.discordSettings.theValenceLogoShownOnYour')}
              >
                <SegmentedRow
                  size="sm"
                  tone="accent"
                  label={say('screens.adminArea.artworkPicker.logo')}
                  items={LOGO_CHOICES}
                  value={presence.logo}
                  onSelect={(chosen) => {
                    change({ logo: DiscordPresenceSchema.shape.logo.parse(chosen) });
                  }}
                />
              </SettingRow>

              <SettingRow
                title={say('common.time')}
                description={say('screens.discordSettings.countsDownTheTimeLeftOr')}
              >
                <SegmentedRow
                  size="sm"
                  tone="accent"
                  label={say('common.time')}
                  items={TIME_CHOICES}
                  value={presence.time}
                  onSelect={(chosen) => {
                    change({ time: DiscordPresenceSchema.shape.time.parse(chosen) });
                  }}
                />
              </SettingRow>

              {HOW_IT_LOOKS.map(({ key, title, description }) => (
                <SettingRow key={key} title={title} description={description}>
                  <Switch
                    label={title}
                    isLabelHidden
                    isOn={presence[key]}
                    onToggle={() => {
                      flip(key);
                    }}
                  />
                </SettingRow>
              ))}
            </>
          )}
        </SettingList>
      </PanelCard>

      {!isShown ? null : (
        <PanelCard
          title={say('common.whatToShow')}
          isFlush
          below={
            <p className="text-sm text-text-muted">
              {say('screens.discordSettings.choosesWhatCanAppearInYour')}
            </p>
          }
        >
          <SettingList isInset>
            {WHAT_IS_SHOWN.map(({ key, title }) => (
              <SettingRow key={key} title={title}>
                <Switch
                  label={title}
                  isLabelHidden
                  isOn={presence[key]}
                  onToggle={() => {
                    flip(key);
                  }}
                />
              </SettingRow>
            ))}

            {watchable.map((library) => {
              const isHidden = presence.hiddenLibraryIds.includes(library.id);

              return (
                <SettingRow key={library.id} title={library.name}>
                  <Switch
                    label={library.name}
                    isLabelHidden
                    isOn={!isHidden}
                    onToggle={() => {
                      change({
                        hiddenLibraryIds: isHidden
                          ? presence.hiddenLibraryIds.filter((id) => id !== library.id)
                          : [...presence.hiddenLibraryIds, library.id],
                      });
                    }}
                  />
                </SettingRow>
              );
            })}
          </SettingList>
        </PanelCard>
      )}
    </>
  );
};

DiscordSettings.displayName = 'DiscordSettings';

export { DiscordSettings };

import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { ANIME_AUDIO_POLICIES } from '@ValenceContracts/schemas/AnimeAudioPolicy';
import { ANIME_AUDIO_NAMES } from '@ValenceClient/requests/ANIME_AUDIO_NAMES';
import { PanelCard } from '@ValenceUI/PanelCard';
import type { CourOrder } from '@ValenceContracts/schemas/Anime';
import type { AnimeSettingsCardProps } from './AnimeSettingsCard.types';
import { say } from '@ValenceI18n/say';

const LIKE_THE_PROFILE = 'profile';

/**
 * How an anime is fetched, on its title page: the speech it's wanted in, or its profile's; the
 * release group it's kept to; how its cours are worked out — on its own, by the catalogue's
 * seasons, by AniList, or by one of the catalogue's episode groups; its English, romaji and
 * Japanese names;
 * and its films, each opening its own page where the Catalogue has one.
 *
 * @param anime - Its cours, names and films.
 * @param animeAudio - The speech chosen for it, or null for its profile's.
 * @param profileAudio - Its profile's speech.
 * @param preferredGroup - The release group it's kept to, or null.
 * @param courOrder - How its cours are worked out.
 * @param films - Its films, with the Catalogue page of each where there is one.
 * @param isBusy - Whether a change is being sent.
 * @param onChangeAudio - Told the speech chosen, or null for the profile's.
 * @param onChangeGroup - Told the release group to keep to, or null for none.
 * @param onChangeCourOrder - Told how to work out its cours.
 * @param onOpenTitle - Called to open a film's page.
 */
const AnimeSettingsCard = ({
  anime,
  animeAudio,
  profileAudio,
  preferredGroup,
  courOrder,
  films,
  isBusy,
  onChangeAudio,
  onChangeGroup,
  onChangeCourOrder,
  onOpenTitle,
}: AnimeSettingsCardProps) => {
  const [group, setGroup] = useState(preferredGroup ?? '');
  const names = [
    ...new Set(
      [anime.names.english, anime.names.romaji, anime.names.native].filter(
        (name): name is string => name !== null,
      ),
    ),
  ];
  const orders: { id: CourOrder; label: string }[] = [
    { id: 'auto', label: say('screens.adminArea.titlePage.animeSettingsCard.workedOutForYou') },
    {
      id: 'seasons',
      label: say('screens.adminArea.titlePage.animeSettingsCard.theCataloguesSeasons'),
    },
    { id: 'anilist', label: say('screens.adminArea.titlePage.animeSettingsCard.aniListsEntries') },
    ...anime.groups.map((one) => ({
      id: `group:${one.id}` as const,
      label: say('screens.adminArea.titlePage.animeSettingsCard.theEpisodeGroup', {
        name: one.name,
      }),
    })),
  ];

  return (
    <PanelCard title={say('common.anime')}>
      <div className="flex flex-col gap-5">
        <SelectField
          label={say('screens.adminArea.profileEditor.animeSpeech')}
          options={[
            {
              id: LIKE_THE_PROFILE,
              label: say('screens.adminArea.titlePage.animeSettingsCard.likeItsProfile', {
                speech: ANIME_AUDIO_NAMES[profileAudio],
              }),
            },
            ...ANIME_AUDIO_POLICIES.map((policy) => ({
              id: policy,
              label: ANIME_AUDIO_NAMES[policy],
            })),
          ]}
          value={animeAudio ?? LIKE_THE_PROFILE}
          onSelect={(next) => {
            onChangeAudio(ANIME_AUDIO_POLICIES.find((policy) => policy === next) ?? null);
          }}
        />

        <span className="flex items-end gap-2">
          <TextField
            label={say('screens.profileEditor.customFormats.releaseGroup')}
            description={say('screens.adminArea.titlePage.animeSettingsCard.keepsTheShowTo')}
            value={group}
            onValueChange={setGroup}
            disabled={isBusy}
            className="flex-1"
          />
          <Button
            variant="secondary"
            disabled={isBusy || group.trim() === (preferredGroup ?? '')}
            onClick={() => {
              onChangeGroup(group.trim() === '' ? null : group.trim());
            }}
          >
            {say('common.save')}
          </Button>
        </span>

        <SelectField
          label={say('screens.adminArea.titlePage.seasonList.cours')}
          description={say('screens.adminArea.titlePage.animeSettingsCard.howTheCoursAreWorkedOut')}
          options={orders}
          value={courOrder}
          onSelect={(next) => {
            const chosen = orders.find((order) => order.id === next);

            if (chosen !== undefined) {
              onChangeCourOrder(chosen.id);
            }
          }}
        />

        {names.length === 0 ? null : (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text">
              {say('screens.adminArea.titlePage.animeSettingsCard.searchedAs')}
            </span>
            <span className="text-sm text-text-muted">{names.join(' · ')}</span>
          </div>
        )}

        {films.length === 0 ? null : (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text">
              {say('screens.adminArea.titlePage.animeSettingsCard.alsoInThisStory')}
            </span>
            <ul className="flex flex-col gap-1">
              {films.map((film) => {
                const named =
                  film.year === null
                    ? film.title
                    : say('screens.importWizard.importReportView.titleYear', {
                        title: film.title,
                        year: film.year.toString(),
                      });
                const { titleKey } = film;

                return (
                  <li key={film.title} className="text-sm text-text-muted">
                    {titleKey === null || onOpenTitle === undefined ? (
                      named
                    ) : (
                      <Button
                        variant="link"
                        size="none"
                        onClick={() => {
                          onOpenTitle(titleKey);
                        }}
                      >
                        {named}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </PanelCard>
  );
};

AnimeSettingsCard.displayName = 'AnimeSettingsCard';

export { AnimeSettingsCard };

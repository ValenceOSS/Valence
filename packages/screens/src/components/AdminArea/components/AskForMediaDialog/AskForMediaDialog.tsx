import { notify } from '@ValenceUI/notify';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import {
  askForMedia,
  findReleasesFor,
  searchMusicCatalogue,
} from '@ValenceClient/requests/fetchMediaRequests';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { ReleaseTypeChooser } from '@ValenceScreens/components/ReleaseTypeChooser/ReleaseTypeChooser';
import { SeasonChooser } from '@ValenceScreens/components/SeasonChooser/SeasonChooser';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import { MusicMatchList } from '@ValenceScreens/components/AdminArea/components/MusicMatchList/MusicMatchList';
import { describeMusicMatch } from '@ValenceScreens/components/AdminArea/components/MusicMatchList/describeMusicMatch';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type {
  MediaRequestAsk,
  MediaRequestKind,
  MusicCatalogueHit,
  ReleaseType,
} from '@ValenceContracts/schemas/MediaRequest';
import type { AskForMediaDialogProps } from './AskForMediaDialog.types';
import { say } from '@ValenceI18n/say';

const KINDS: readonly { id: MediaRequestKind; label: string; searchFor: string }[] = [
  {
    id: 'film',
    label: say('common.aFilm2'),
    searchFor: say('screens.adminArea.matchPicker.searchForAFilm'),
  },
  {
    id: 'series',
    label: say('common.aSeries2'),
    searchFor: say('screens.adminArea.matchPicker.searchForASeries'),
  },
  {
    id: 'artist',
    label: say('screens.adminArea.askForMediaDialog.anArtist2'),
    searchFor: say('screens.adminArea.askForMediaDialog.searchForAnArtist'),
  },
  {
    id: 'album',
    label: say('screens.adminArea.askForMediaDialog.anAlbum2'),
    searchFor: say('screens.adminArea.askForMediaDialog.searchForAnAlbum'),
  },
];

type Chosen = {
  title: string;
  year: number | null;
  overview: string | null;
  tmdbId: number | null;
  musicBrainzId: string | null;
};

/**
 * A film or series the catalogue offered, as the thing chosen to ask for.
 *
 * @param match - What the catalogue offered.
 * @returns It chosen.
 */
const chosenFilm = (match: CatalogueMatch): Chosen => ({
  title: match.title,
  year: match.year,
  overview: match.overview,
  tmdbId: Number(match.externalId),
  musicBrainzId: null,
});

/**
 * An artist or album MusicBrainz found, as the thing chosen to ask for.
 *
 * @param match - What was found.
 * @returns It chosen.
 */
const chosenMusic = (match: MusicCatalogueHit): Chosen => ({
  title: match.title,
  year: match.kind === 'album' ? match.year : null,
  overview: describeMusicMatch(match),
  tmdbId: null,
  musicBrainzId: match.musicBrainzId,
});

const THE_LIBRARYS = 'library';

const LATER_PICKS: Readonly<Record<MediaRequestKind, string>> = {
  film: '',
  series: say('screens.adminArea.askForMediaDialog.laterEpisodesWaitForAPick'),
  artist: say('screens.adminArea.askForMediaDialog.laterAlbumsWaitForAPick'),
  album: '',
  book: '',
};

const PICKING = [
  { id: 'best', label: say('screens.adminArea.askForMediaDialog.theBestByItsQuality') },
  { id: 'hand', label: say('screens.adminArea.askForMediaDialog.iWillPickIt') },
] as const;

/**
 * Asks for a film, a series, an artist or an album: the catalogue — TMDB, or MusicBrainz for music
 * — is searched for it by name, and once one is chosen, it says the quality wanted — a profile of
 * its own, or its library's, which also says how long a film is held before it is searched for —
 * a series which of its seasons are wanted, or every one and whatever comes later, and an artist
 * which kinds of their releases are, now and as they come out.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onAsked - Told the request once it is made.
 */
const AskForMediaDialog = ({ isOpen, onClose, onAsked }: AskForMediaDialogProps) => {
  const [kind, setKind] = useState<MediaRequestKind>('film');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<CatalogueMatch[] | null>(null);
  const [musicMatches, setMusicMatches] = useState<MusicCatalogueHit[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [releaseTypes, setReleaseTypes] = useState<ReleaseType[]>(['album']);
  const [seasons, setSeasons] = useState<number[] | null>(null);
  const [isPickedByHand, setIsPickedByHand] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [found, setFound] = useState<{ outcome: ReleaseSearchOutcome; at: number } | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const profiles = useQuery({ ...requestsQueries.profiles(), enabled: isOpen });
  const isMusic = isMusicRequest(kind);
  const qualities = [
    { id: THE_LIBRARYS, label: say('common.theLibrarysOwnProfile') },
    ...(profiles.data ?? [])
      .filter((profile) => profile.kind === (isMusic ? 'music' : 'video'))
      .map((profile) => ({ id: profile.id, label: profile.name })),
  ];
  const [problem, setProblem] = useState<string | null>(null);

  const isReady =
    chosen !== null &&
    (seasons === null || seasons.length > 0) &&
    (kind !== 'artist' || releaseTypes.length > 0);

  const look = () => {
    setIsSearching(true);
    setProblem(null);

    if (kind === 'artist' || kind === 'album') {
      void searchMusicCatalogue(query.trim(), kind)
        .catch(() => [])
        .then((found) => {
          setMusicMatches(found);
          setIsSearching(false);
        });

      return;
    }

    void searchCatalogue(query.trim(), kind === 'film' ? 'movie' : 'tv').then((found) => {
      setMatches(found);
      setIsSearching(false);
    });
  };

  const asking = (): MediaRequestAsk | null =>
    chosen === null
      ? null
      : {
          kind,
          ...(chosen.tmdbId === null ? {} : { tmdbId: chosen.tmdbId }),
          ...(chosen.musicBrainzId === null ? {} : { musicBrainzId: chosen.musicBrainzId }),
          ...(profileId === null ? {} : { profileId }),
          isPickedByHand,
          ...(kind === 'series' ? { seasons } : {}),
          ...(kind === 'artist' ? { releaseTypes } : {}),
        };

  const findReleases = () => {
    const asked = asking();

    if (asked === null) {
      return;
    }

    setIsFinding(true);
    setProblem(null);

    void findReleasesFor(asked)
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(
            refusal?.message ??
              say('screens.adminArea.askForMediaDialog.theIndexersCouldNotBeAsked'),
          );

          return;
        }

        setFound({ outcome: value, at: Date.now() });
      })
      .finally(() => {
        setIsFinding(false);
      });
  };

  const ask = (release: Release | null = null) => {
    const asked = asking();

    if (asked === null) {
      return;
    }

    setIsAsking(true);
    setPickingId(release?.id ?? null);
    setProblem(null);

    void askForMedia({ ...asked, ...(release === null ? {} : { release }) })
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? say('common.thatCouldNotBeRequested'));

          return;
        }

        notify.worked(say('screens.adminArea.askForMediaDialog.askedForIt'));
        onAsked(value);
        setChosen(null);
        setMatches(null);
        setMusicMatches(null);
        setFound(null);
        setQuery('');
        onClose();
      })
      .finally(() => {
        setIsAsking(false);
        setPickingId(null);
      });
  };

  return (
    <DialogCompanion
      label={say('common.requestMedia')}
      isOpen={isOpen}
      onClose={onClose}
      size="stage"
    >
      <DialogTitle
        size="compact"
        title={say('common.requestMedia')}
        detail={say('screens.adminArea.askForMediaDialog.findAFilmASeriesAn')}
      />

      <DialogContent
        className={cn(
          'flex flex-col gap-4',
          found !== null && chosen !== null ? 'min-h-0 overflow-hidden' : '',
        )}
      >
        {found !== null && chosen !== null ? (
          <ReleasePickTable
            found={found.outcome}
            foundAt={found.at}
            pickingId={pickingId}
            emptyMessage={say('screens.adminArea.askForMediaDialog.nothingTheIndexersHaveIsFor')}
            onPick={(release) => {
              ask(release);
            }}
          />
        ) : chosen === null ? (
          <>
            <FormField label={say('screens.adminArea.askForMediaDialog.what')}>
              <SegmentedRow
                label={say('screens.adminArea.askForMediaDialog.what')}
                size="sm"
                items={KINDS}
                value={kind}
                onSelect={(next) => {
                  const picked = KINDS.find((one) => one.id === next)?.id;

                  if (picked !== undefined) {
                    setKind(picked);
                    setMatches(null);
                    setMusicMatches(null);
                    setProfileId(null);
                  }
                }}
              />
            </FormField>

            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();

                if (query.trim() !== '') {
                  look();
                }
              }}
            >
              <TextField
                label={
                  KINDS.find((one) => one.id === kind)?.searchFor ??
                  say('screens.adminArea.askForMediaDialog.searchForIt')
                }
                value={query}
                onValueChange={setQuery}
                className="min-w-0 flex-1"
              />

              <Button
                type="submit"
                variant="secondary"
                disabled={query.trim() === ''}
                isLoading={isSearching}
              >
                <Icon of={SearchIcon} size={16} />
                {say('common.search')}
              </Button>
            </form>

            {isSearching ? <Spinner label={say('common.askingTheCatalogue')} size="sm" /> : null}

            {isSearching ? null : isMusic ? (
              musicMatches === null ? null : musicMatches.length === 0 ? (
                <p className="font-body text-sm text-text-muted">
                  {say('screens.adminArea.askForMediaDialog.musicBrainzKnowsNothingUnderThatName')}
                </p>
              ) : (
                <MusicMatchList
                  matches={musicMatches}
                  onChoose={(match) => {
                    setChosen(chosenMusic(match));
                  }}
                />
              )
            ) : matches === null ? null : matches.length === 0 ? (
              <p className="font-body text-sm text-text-muted">
                {say('common.nothingCameBackUnderThatName')}
              </p>
            ) : (
              <CatalogueMatchList
                matches={matches}
                onChoose={(match) => {
                  setChosen(chosenFilm(match));
                }}
              />
            )}
          </>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-sm font-medium text-text">
                  {chosen.title}
                  {chosen.year === null ? '' : ` (${chosen.year.toString()})`}
                </span>
                <span className="line-clamp-3 font-body text-xs text-text-muted">
                  {chosen.overview ?? (isMusic ? '' : say('common.noSynopsis'))}
                </span>
              </span>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setChosen(null);
                  setSeasons(null);
                  setFound(null);
                }}
              >
                {say('common.chooseAnother')}
              </Button>
            </div>

            <SelectField
              label={say('common.quality')}
              description={say('common.theProfileItsReleasesAreJudged')}
              options={qualities}
              value={profileId ?? THE_LIBRARYS}
              onSelect={(next) => {
                setProfileId(next === THE_LIBRARYS ? null : next);
              }}
              placeholder={say('common.theLibrarysOwnProfile')}
            />

            {kind !== 'artist' ? null : (
              <ReleaseTypeChooser value={releaseTypes} onChange={setReleaseTypes} />
            )}

            {kind !== 'series' || chosen.tmdbId === null ? null : (
              <SeasonChooser tmdbId={chosen.tmdbId} seasons={seasons} onChange={setSeasons} />
            )}

            <FormField
              label={say('common.release')}
              description={
                isPickedByHand
                  ? say('screens.adminArea.askForMediaDialog.youPickFromWhatTheIndexers', {
                      LATER_PICKS: LATER_PICKS[kind],
                    })
                  : say('screens.adminArea.askForMediaDialog.theBestReleaseByItsQuality')
              }
            >
              <SegmentedRow
                label={say('common.release')}
                size="sm"
                items={PICKING}
                value={isPickedByHand ? 'hand' : 'best'}
                onSelect={(next) => {
                  setIsPickedByHand(next === 'hand');
                }}
              />
            </FormField>
          </>
        )}
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: onClose }}
        confirm={
          found !== null
            ? undefined
            : isPickedByHand
              ? {
                  label: say('screens.adminArea.askForMediaDialog.findReleases'),
                  isDisabled: !isReady,
                  isLoading: isFinding,
                  onChoose: findReleases,
                }
              : {
                  label: say('screens.adminArea.askForMediaDialog.requestIt'),
                  isDisabled: !isReady,
                  isLoading: isAsking,
                  onChoose: () => {
                    ask();
                  },
                }
        }
      >
        {found === null ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setFound(null);
            }}
          >
            {say('common.back')}
          </Button>
        )}
      </DialogFooter>
    </DialogCompanion>
  );
};

AskForMediaDialog.displayName = 'AskForMediaDialog';

export { AskForMediaDialog };

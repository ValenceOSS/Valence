import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search01Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { Button } from '@ValenceUI/Button';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { FormField } from '@ValenceUI/FormField';
import { Icon } from '@ValenceUI/Icon';
import { Checkbox } from '@ValenceUI/Checkbox';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForMedia, findReleasesFor } from '@ValenceClient/requests/fetchMediaRequests';
import { ReleasePickTable } from '@ValenceScreens/components/AdminArea/components/ReleasePickTable/ReleasePickTable';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { Release, ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';
import type {
  MediaRequestAsk,
  MediaRequestKind,
  ReleaseWait,
} from '@ValenceContracts/schemas/MediaRequest';
import type { AskForMediaDialogProps } from './AskForMediaDialog.types';

const KINDS: readonly { id: MediaRequestKind; label: string }[] = [
  { id: 'film', label: 'A film' },
  { id: 'series', label: 'A series' },
];

const WAITS: readonly { id: ReleaseWait; label: string }[] = [
  { id: 'digital', label: 'Out digitally' },
  { id: 'physical', label: 'Out on disc' },
];

const THE_LIBRARYS = 'library';

const PICKING = [
  { id: 'best', label: 'The best by its quality' },
  { id: 'hand', label: 'I will pick it' },
] as const;

const SEASON_CHOICES = [
  { id: 'every', label: 'Every season, and later ones' },
  { id: 'some', label: 'Only some seasons' },
] as const;

/**
 * Asks for a film or a series: the catalogue is searched for it by name, and once one is chosen, it
 * says the quality wanted — a profile of its own, or its library's — and a film what it waits for
 * before it is searched for, out digitally or on disc, and a series which of its seasons are
 * wanted, or every one and whatever comes later.
 *
 * @param isOpen - Whether the dialog is showing.
 * @param onClose - Called when it is dismissed.
 * @param onAsked - Told the request once it is made.
 */
const AskForMediaDialog = ({ isOpen, onClose, onAsked }: AskForMediaDialogProps) => {
  const [kind, setKind] = useState<MediaRequestKind>('film');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<CatalogueMatch[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [chosen, setChosen] = useState<CatalogueMatch | null>(null);
  const [waitFor, setWaitFor] = useState<ReleaseWait>('digital');
  const [seasonChoice, setSeasonChoice] = useState<'every' | 'some'>('every');
  const [picked, setPicked] = useState<ReadonlySet<number>>(new Set());
  const [isPickedByHand, setIsPickedByHand] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [found, setFound] = useState<{ outcome: ReleaseSearchOutcome; at: number } | null>(null);
  const [isFinding, setIsFinding] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const profiles = useQuery({ ...requestsQueries.profiles(), enabled: isOpen });
  const qualities = [
    { id: THE_LIBRARYS, label: 'The library’s own profile' },
    ...(profiles.data ?? [])
      .filter((profile) => profile.kind === 'video')
      .map((profile) => ({ id: profile.id, label: profile.name })),
  ];
  const quality = qualities.find((one) => one.id === (profileId ?? THE_LIBRARYS));
  const [problem, setProblem] = useState<string | null>(null);

  const listed = useQuery(
    requestsQueries.seriesSeasons(
      chosen === null || kind !== 'series' ? null : Number(chosen.externalId),
    ),
  );
  const seasons =
    seasonChoice === 'every' ? null : [...picked].toSorted((left, right) => left - right);
  const isReady = chosen !== null && (seasons === null || seasons.length > 0);

  const look = () => {
    setIsSearching(true);
    setProblem(null);

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
          tmdbId: Number(chosen.externalId),
          ...(profileId === null ? {} : { profileId }),
          isPickedByHand,
          ...(kind === 'film' ? { waitFor } : { seasons }),
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
          setProblem(refusal?.message ?? 'The indexers could not be asked.');

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
          setProblem(refusal?.message ?? 'That could not be asked for.');

          return;
        }

        onAsked(value);
        setChosen(null);
        setMatches(null);
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
    <DialogCompanion label="Ask for something" isOpen={isOpen} onClose={onClose}>
      <DialogTitle
        size="compact"
        title="Ask for something"
        detail="Find a film or series in the catalogue. Once it is approved, it is searched for, downloaded and filed into its library."
      />

      <DialogContent className="flex flex-col gap-4">
        {found !== null && chosen !== null ? (
          <ReleasePickTable
            found={found.outcome}
            foundAt={found.at}
            pickingId={pickingId}
            emptyMessage="Nothing the indexers have is for this. Go back and fetch the best by itself, to wait for one."
            onPick={(release) => {
              ask(release);
            }}
          />
        ) : chosen === null ? (
          <>
            <FormField label="What">
              <SegmentedRow
                label="What"
                size="sm"
                items={KINDS}
                value={kind}
                onSelect={(next) => {
                  const picked = KINDS.find((one) => one.id === next)?.id;

                  if (picked !== undefined) {
                    setKind(picked);
                    setMatches(null);
                  }
                }}
              />
            </FormField>

            <div className="flex flex-wrap items-end gap-3">
              <TextField
                label={`Search for a ${kind === 'film' ? 'film' : 'series'}`}
                value={query}
                onValueChange={setQuery}
                className="min-w-0 flex-1"
              />

              <Button
                variant="secondary"
                disabled={query.trim() === ''}
                isLoading={isSearching}
                onClick={look}
              >
                <Icon of={Search01Icon} size={16} />
                Search
              </Button>
            </div>

            {isSearching ? <Spinner label="Asking the catalogue" size="sm" /> : null}

            {matches === null || isSearching ? null : matches.length === 0 ? (
              <p className="font-body text-sm text-text-muted">
                Nothing came back under that name.
              </p>
            ) : (
              <CatalogueMatchList matches={matches} onChoose={setChosen} />
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
                  {chosen.overview ?? 'No synopsis.'}
                </span>
              </span>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setChosen(null);
                  setPicked(new Set());
                  setFound(null);
                }}
              >
                Choose another
              </Button>
            </div>

            <FormField
              label="Quality"
              description="The profile its releases are judged by. Profiles are kept on the Profiles page."
            >
              <OptionMenu
                label="Quality"
                triggerShape="field"
                matchTriggerWidth
                groups={[
                  {
                    name: 'Quality',
                    selectedId: profileId ?? THE_LIBRARYS,
                    onSelect: (next) => {
                      setProfileId(next === THE_LIBRARYS ? null : next);
                    },
                    options: qualities,
                  },
                ]}
                trigger={
                  <>
                    <span className="truncate">
                      {quality?.label ?? 'The library’s own profile'}
                    </span>
                    <Icon of={UnfoldMoreIcon} size={15} className="shrink-0" />
                  </>
                }
              />
            </FormField>

            {kind === 'film' ? (
              <FormField
                label="Search once it is"
                description="A film is held until then, so nothing is fetched from cinemas."
              >
                <SegmentedRow
                  label="Search once it is"
                  size="sm"
                  items={WAITS}
                  value={waitFor}
                  onSelect={(next) => {
                    const picked = WAITS.find((one) => one.id === next)?.id;

                    if (picked !== undefined) {
                      setWaitFor(picked);
                    }
                  }}
                />
              </FormField>
            ) : (
              <>
                <FormField label="Seasons">
                  <SegmentedRow
                    label="Seasons"
                    size="sm"
                    items={SEASON_CHOICES}
                    value={seasonChoice}
                    onSelect={(next) => {
                      setSeasonChoice(next === 'some' ? 'some' : 'every');
                    }}
                  />
                </FormField>

                {seasonChoice === 'every' ? null : listed.data === undefined ? (
                  <Spinner label="Asking the catalogue for its seasons" size="sm" />
                ) : (
                  <ul aria-label="Which seasons" className="grid gap-2 sm:grid-cols-2">
                    {listed.data.map((one) => (
                      <li key={one.season}>
                        <Checkbox
                          label={one.season === 0 ? 'Specials' : `Season ${one.season.toString()}`}
                          description={[
                            `${one.episodeCount.toString()} episode${one.episodeCount === 1 ? '' : 's'}`,
                            ...(one.firstAired === null ? [] : [one.firstAired.slice(0, 4)]),
                          ].join(' · ')}
                          checked={picked.has(one.season)}
                          onCheckedChange={(isChecked) => {
                            const next = new Set(picked);

                            if (isChecked) {
                              next.add(one.season);
                            } else {
                              next.delete(one.season);
                            }

                            setPicked(next);
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            <FormField
              label="Release"
              description={
                isPickedByHand
                  ? 'You pick from what the indexers have before anything is asked for. Later episodes wait for a pick too.'
                  : 'The best release by its quality is fetched as soon as one turns up.'
              }
            >
              <SegmentedRow
                label="Release"
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

      <DialogFooter>
        {problem === null ? null : (
          <span role="alert" className="mr-auto text-sm text-danger">
            {problem}
          </span>
        )}

        {found === null ? null : (
          <Button
            variant="secondary"
            onClick={() => {
              setFound(null);
            }}
          >
            Back
          </Button>
        )}

        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        {found !== null ? null : isPickedByHand ? (
          <Button variant="glossy" disabled={!isReady} isLoading={isFinding} onClick={findReleases}>
            Find releases
          </Button>
        ) : (
          <Button
            variant="glossy"
            disabled={!isReady}
            isLoading={isAsking}
            onClick={() => {
              ask();
            }}
          >
            Ask for it
          </Button>
        )}
      </DialogFooter>
    </DialogCompanion>
  );
};

AskForMediaDialog.displayName = 'AskForMediaDialog';

export { AskForMediaDialog };

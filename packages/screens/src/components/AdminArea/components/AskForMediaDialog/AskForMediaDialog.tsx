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
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { Spinner } from '@ValenceUI/Spinner';
import { TextField } from '@ValenceUI/TextField';
import { searchCatalogue } from '@ValenceClient/admin/fetchAdmin';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import { readSeasonList } from './readSeasonList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { MediaRequestKind, ReleaseWait } from '@ValenceContracts/schemas/MediaRequest';
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
  const [seasonText, setSeasonText] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const profiles = useQuery({ ...requestsQueries.profiles(), enabled: isOpen });
  const qualities = [
    { id: THE_LIBRARYS, label: 'The library’s own profile' },
    ...(profiles.data ?? [])
      .filter((profile) => profile.kind === 'video')
      .map((profile) => ({ id: profile.id, label: profile.name })),
  ];
  const quality = qualities.find((one) => one.id === (profileId ?? THE_LIBRARYS));
  const [problem, setProblem] = useState<string | null>(null);

  const seasons = seasonChoice === 'every' ? null : readSeasonList(seasonText);
  const isReady = chosen !== null && (seasonChoice === 'every' || seasons !== null);

  const look = () => {
    setIsSearching(true);
    setProblem(null);

    void searchCatalogue(query.trim(), kind === 'film' ? 'movie' : 'tv').then((found) => {
      setMatches(found);
      setIsSearching(false);
    });
  };

  const ask = () => {
    if (chosen === null) {
      return;
    }

    setIsAsking(true);
    setProblem(null);

    void askForMedia({
      kind,
      tmdbId: Number(chosen.externalId),
      ...(profileId === null ? {} : { profileId }),
      ...(kind === 'film' ? { waitFor } : { seasons }),
    })
      .then(({ value, refusal }) => {
        if (value === null) {
          setProblem(refusal?.message ?? 'That could not be asked for.');

          return;
        }

        onAsked(value);
        setChosen(null);
        setMatches(null);
        setQuery('');
        onClose();
      })
      .finally(() => {
        setIsAsking(false);
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
        {chosen === null ? (
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

                {seasonChoice === 'every' ? null : (
                  <TextField
                    label="Which seasons"
                    value={seasonText}
                    onValueChange={setSeasonText}
                    placeholder="1, 3-5"
                    description="Specials are season 0."
                    {...(seasonText !== '' && seasons === null
                      ? { error: 'Seasons are numbers, such as 1, 3-5.' }
                      : {})}
                  />
                )}
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogFooter>
        {problem === null ? null : (
          <span role="alert" className="mr-auto text-sm text-danger">
            {problem}
          </span>
        )}

        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button variant="glossy" disabled={!isReady} isLoading={isAsking} onClick={ask}>
          Ask for it
        </Button>
      </DialogFooter>
    </DialogCompanion>
  );
};

AskForMediaDialog.displayName = 'AskForMediaDialog';

export { AskForMediaDialog };

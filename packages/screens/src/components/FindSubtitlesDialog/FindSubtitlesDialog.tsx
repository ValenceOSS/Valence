import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DataTable } from '@ValenceUI/DataTable';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { SelectField } from '@ValenceUI/SelectField';
import { Spinner } from '@ValenceUI/Spinner';
import { notify } from '@ValenceUI/notify';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { findSubtitles } from '@ValenceClient/library/findSubtitles';
import { fetchFoundSubtitle } from '@ValenceClient/library/fetchFoundSubtitle';
import { SUBTITLE_LANGUAGES } from '@ValenceContracts/constants/SUBTITLE_LANGUAGES';
import type { FoundSubtitle, SubtitleReason } from '@ValenceContracts/schemas/SubtitleFinding';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { FindSubtitlesDialogProps } from './FindSubtitlesDialog.types';
import { say } from '@ValenceI18n/say';

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' });

const SOURCE_NAMES = { opensubtitles: 'OpenSubtitles', subdl: 'SubDL' } as const;

const REASONS = {
  madeForThisFile: { label: say('screens.findSubtitlesDialog.madeForThisFile'), tone: 'success' },
  sameRelease: { label: say('screens.findSubtitlesDialog.sameRelease'), tone: 'accent' },
  sameGroup: { label: say('screens.findSubtitlesDialog.sameGroup'), tone: 'quiet' },
  sameSource: { label: say('screens.findSubtitlesDialog.sameSource'), tone: 'quiet' },
  sameResolution: { label: say('screens.findSubtitlesDialog.sameResolution'), tone: 'quiet' },
  sameVideoCodec: { label: say('screens.findSubtitlesDialog.sameVideoCodec'), tone: 'quiet' },
  sameAudioCodec: { label: say('screens.findSubtitlesDialog.sameAudioCodec'), tone: 'quiet' },
  sameService: { label: say('screens.findSubtitlesDialog.sameService'), tone: 'quiet' },
  sameEdition: { label: say('screens.findSubtitlesDialog.sameEdition'), tone: 'quiet' },
  sameFrameRate: { label: say('screens.findSubtitlesDialog.sameFrameRate'), tone: 'quiet' },
  differentFrameRate: {
    label: say('screens.findSubtitlesDialog.differentFrameRateWillDrift'),
    tone: 'danger',
  },
} as const satisfies Record<
  SubtitleReason,
  { label: string; tone: 'success' | 'accent' | 'quiet' | 'danger' }
>;

/**
 * Looks for subtitles for one film or episode on the sites Valence has keys for, in a language
 * chosen from the ones the server offers first, and fetches the one chosen, which the server keeps
 * so every app finds it. They are listed by how well they fit this file, each saying why: made for
 * this very file, the same release, the same frame rate, or a different one that will drift.
 *
 * @param media - The film or episode, by its id and name, or nothing while the dialog is shut.
 * @param onClose - Called when it is dismissed.
 * @param onFetched - Told when a subtitle has been fetched, so what lists the subtitles can look
 *   again.
 */
const FindSubtitlesDialog = ({ media, onClose, onFetched }: FindSubtitlesDialogProps) => {
  const setup = useQuery({ ...adminQueries.subtitleSetup(), retry: false });
  const preferred = setup.data?.languages ?? [];
  const [chosen, setChosen] = useState<string | null>(null);
  const language = chosen ?? preferred[0] ?? 'en';
  const [fetching, setFetching] = useState<string | null>(null);
  const [fetched, setFetched] = useState<ReadonlySet<string>>(new Set());
  const [problem, setProblem] = useState<string | null>(null);
  const found = useQuery({
    queryKey: ['subtitles', 'found', media?.id ?? null, language],
    queryFn: () => findSubtitles(media?.id ?? '', language),
    enabled: media !== null,
    retry: false,
    staleTime: 0,
  });
  const languages = [...new Set([...preferred, ...SUBTITLE_LANGUAGES])].map((code) => ({
    id: code,
    label: LANGUAGE_NAMES.of(code) ?? code,
  }));
  const title =
    media === null
      ? say('screens.findSubtitlesDialog.findSubtitles')
      : say('screens.findSubtitlesDialog.findSubtitlesForName', { name: media.name });

  const take = (subtitle: FoundSubtitle) => {
    if (media === null) {
      return;
    }

    const key = `${subtitle.source}:${subtitle.id}`;

    setFetching(key);
    setProblem(null);

    void fetchFoundSubtitle(media.id, {
      source: subtitle.source,
      id: subtitle.id,
      language,
    })
      .then((answer) => {
        if ('problem' in answer) {
          setProblem(answer.problem);

          return;
        }

        setFetched(new Set([...fetched, key]));
        notify.worked(
          say('screens.findSubtitlesDialog.savedName', {
            name: LANGUAGE_NAMES.of(language) ?? language,
          }),
        );
        onFetched?.();
      })
      .finally(() => {
        setFetching(null);
      });
  };

  const columns: DataTableColumn<FoundSubtitle>[] = [
    {
      id: 'release',
      header: say('common.release'),
      accessorFn: (subtitle) => subtitle.name,
      meta: { fills: true },
      cell: ({ row }) => (
        <span className="block max-w-[28rem] truncate text-text" title={row.original.name}>
          {row.original.name}
        </span>
      ),
    },
    {
      id: 'score',
      header: say('screens.findSubtitlesDialog.match'),
      accessorFn: (subtitle) => subtitle.score,
      meta: { shrinks: true },
      cell: ({ row }) => <span className="tabular-nums text-text">{row.original.score}</span>,
    },
    {
      id: 'why',
      header: say('common.why'),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="flex flex-wrap gap-1.5">
          {row.original.reasons.map((reason) => (
            <Badge key={reason} size="sm" tone={REASONS[reason].tone}>
              {REASONS[reason].label}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      id: 'notes',
      header: say('screens.findSubtitlesDialog.notes'),
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => (
        <span className="flex flex-wrap gap-1.5">
          {row.original.isHearingImpaired ? (
            <Badge size="sm">{say('screens.findSubtitlesDialog.sdh')}</Badge>
          ) : null}
          {row.original.isMachineTranslated ? (
            <Badge size="sm" tone="warning">
              {say('screens.findSubtitlesDialog.machineTranslated')}
            </Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: 'source',
      header: say('common.site'),
      accessorFn: (subtitle) => SOURCE_NAMES[subtitle.source],
      meta: { shrinks: true },
      cell: ({ row }) => (
        <span className="text-text-muted">{SOURCE_NAMES[row.original.source]}</span>
      ),
    },
    {
      id: 'downloads',
      header: say('common.downloads'),
      accessorFn: (subtitle) => subtitle.downloads ?? -1,
      meta: { shrinks: true },
      cell: ({ row }) => (
        <span className="tabular-nums text-text-muted">
          {row.original.downloads === null ? '—' : row.original.downloads.toLocaleString()}
        </span>
      ),
    },
    {
      id: 'get',
      header: '',
      enableSorting: false,
      meta: { shrinks: true },
      cell: ({ row }) => {
        const key = `${row.original.source}:${row.original.id}`;

        return fetched.has(key) ? (
          <Badge size="sm" tone="success">
            {say('screens.findSubtitlesDialog.saved')}
          </Badge>
        ) : (
          <Button
            variant="secondary"
            size="xs"
            isLoading={fetching === key}
            disabled={fetching !== null && fetching !== key}
            onClick={() => {
              take(row.original);
            }}
          >
            {say('screens.findSubtitlesDialog.get')}
          </Button>
        );
      },
    },
  ];

  return (
    <DialogCompanion
      size="stage"
      label={title}
      isOpen={media !== null}
      onClose={() => {
        setProblem(null);
        setFetched(new Set());
        onClose();
      }}
    >
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.findSubtitlesDialog.savedBesideTheVideo')}
      />

      <DialogContent className="flex flex-col gap-4">
        <SelectField
          label={say('screens.adminArea.subtitlesCard.languages')}
          options={languages}
          value={language}
          onSelect={setChosen}
          className="max-w-xs"
        />

        {found.isError ? (
          <CouldNotRead
            said={say('screens.findSubtitlesDialog.theSubtitleSitesCouldNotBe')}
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : found.data === undefined ? (
          <Spinner isCentered size="sm" label={say('screens.findSubtitlesDialog.looking')} />
        ) : !found.data.isSetUp ? (
          <p className="text-sm text-text-muted">
            {say('screens.findSubtitlesDialog.noSubtitleSiteIsSetUp')}
          </p>
        ) : found.data.subtitles.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.findSubtitlesDialog.nothingWasFoundInThatLanguage')}
          </p>
        ) : (
          <DataTable
            label={say('screens.findSubtitlesDialog.subtitlesFound')}
            columns={columns}
            rows={found.data.subtitles}
            getRowId={(subtitle) => `${subtitle.source}:${subtitle.id}`}
            pageSize={50}
            height="compact"
          />
        )}
      </DialogContent>

      <DialogFooter note={problem} dismiss={{ onChoose: onClose, label: say('common.done') }} />
    </DialogCompanion>
  );
};

FindSubtitlesDialog.displayName = 'FindSubtitlesDialog';

export { FindSubtitlesDialog };

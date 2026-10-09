import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
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
import { SlidingList } from '@ValenceScreens/components/SlidingList/SlidingList';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';
import type { FindSubtitlesDialogProps } from './FindSubtitlesDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const LANGUAGE_NAMES = new Intl.DisplayNames(undefined, { type: 'language' });

const SOURCE_NAMES = { opensubtitles: 'OpenSubtitles', subdl: 'SubDL' } as const;

/**
 * Looks for subtitles for one film or episode on the sites Valence has keys for, in a language
 * chosen from the ones the server offers first, and fetches the one chosen, which the server keeps
 * beside the video so every app finds it. Those timed to this very file are listed first and marked.
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
        notify.worked(say('screens.findSubtitlesDialog.savedName', { name: answer.name }));
        onFetched?.();
      })
      .finally(() => {
        setFetching(null);
      });
  };

  return (
    <DialogCompanion
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
          <div className="max-h-[50vh] overflow-y-auto">
            <SlidingList
              label={say('screens.findSubtitlesDialog.subtitlesFound')}
              items={found.data.subtitles}
              keyOf={(subtitle) => `${subtitle.source}:${subtitle.id}`}
              renderItem={(subtitle) => {
                const key = `${subtitle.source}:${subtitle.id}`;

                return (
                  <span className="flex items-center gap-3 py-2.5">
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm text-text">{subtitle.name}</span>
                      <span className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                        {subtitle.isExactMatch ? (
                          <Badge size="sm" tone="success">
                            {say('screens.findSubtitlesDialog.timedToThisFile')}
                          </Badge>
                        ) : null}
                        {subtitle.isHearingImpaired ? (
                          <Badge size="sm">{say('screens.findSubtitlesDialog.sdh')}</Badge>
                        ) : null}
                        <span>{SOURCE_NAMES[subtitle.source]}</span>
                        {subtitle.downloads === null ? null : (
                          <span>
                            ·{' '}
                            {sayCount(
                              'screens.findSubtitlesDialog.count.downloads',
                              subtitle.downloads,
                            )}
                          </span>
                        )}
                      </span>
                    </span>

                    {fetched.has(key) ? (
                      <Badge size="sm" tone="success">
                        {say('screens.findSubtitlesDialog.saved')}
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="xs"
                        isLoading={fetching === key}
                        disabled={fetching !== null && fetching !== key}
                        onClick={() => {
                          take(subtitle);
                        }}
                      >
                        {say('screens.findSubtitlesDialog.get')}
                      </Button>
                    )}
                  </span>
                );
              }}
            />
          </div>
        )}
      </DialogContent>

      <DialogFooter note={problem} dismiss={{ onChoose: onClose, label: say('common.done') }} />
    </DialogCompanion>
  );
};

FindSubtitlesDialog.displayName = 'FindSubtitlesDialog';

export { FindSubtitlesDialog };

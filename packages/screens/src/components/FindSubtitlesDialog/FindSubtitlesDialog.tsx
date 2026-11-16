import { useState } from 'react';
import { saidByTheServer } from '@ValenceClient/query/saidByTheServer';
import { useQuery } from '@tanstack/react-query';
import { ChoiceList } from '@ValenceUI/ChoiceList';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { DialogCompanion } from '@ValenceUI/DialogCompanion';
import { DialogContent } from '@ValenceUI/DialogContent';
import { DialogFooter } from '@ValenceUI/DialogFooter';
import { DialogTitle } from '@ValenceUI/DialogTitle';
import { Badge } from '@ValenceUI/Badge';
import { SelectField } from '@ValenceUI/SelectField';
import { Skeleton } from '@ValenceUI/Skeleton';
import { cn } from '@ValenceUI/cn';
import { notify } from '@ValenceUI/notify';
import { findSubtitles } from '@ValenceClient/library/findSubtitles';
import { readSubtitleFinding } from '@ValenceClient/library/readSubtitleFinding';
import { fetchFoundSubtitle } from '@ValenceClient/library/fetchFoundSubtitle';
import { languageName } from '@ValenceClient/playback/languageName';
import { SUBTITLE_CRITERION_LABELS } from '@ValenceClient/library/SUBTITLE_CRITERION_LABELS';
import { SUBTITLE_REASON_LABELS } from '@ValenceClient/library/SUBTITLE_REASON_LABELS';
import { SUBTITLE_SITE_NAMES } from '@ValenceClient/library/SUBTITLE_SITE_NAMES';
import { SUBTITLE_LANGUAGES } from '@ValenceContracts/constants/SUBTITLE_LANGUAGES';
import { SUBTITLE_CRITERIA } from '@ValenceContracts/schemas/SubtitleFinding';
import type { FoundSubtitle, SubtitleFinding } from '@ValenceContracts/schemas/SubtitleFinding';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { Choice } from '@ValenceUI/ChoiceList.types';
import type { FindSubtitlesDialogProps } from './FindSubtitlesDialog.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const WAITING_ROWS = 4;

type Check = { label: string; look: 'matches' | 'misses' | 'unknowns' | 'warns' };

/**
 * Names a subtitle found on a site by where it came from and its id there, which together are
 * unique.
 *
 * @param subtitle - The subtitle.
 * @returns Its key.
 */
const keyOf = (subtitle: Pick<FoundSubtitle, 'source' | 'id'>): string =>
  `${subtitle.source}:${subtitle.id}`;

/**
 * What a subtitle shares with the file and what it does not: each thing it was checked on, ticked
 * where it matches, crossed where it does not and marked unknown where the file or the subtitle
 * does not say, with a frame rate that differs said as the warning it is. A server that does not say what it checked gives only
 * what matched.
 *
 * @param subtitle - The subtitle.
 * @returns Each line, by its label and whether it matched, missed or warns.
 */
const checksOf = (subtitle: FoundSubtitle): Check[] => {
  const warnings = [
    ...(subtitle.reasons.includes('differentFrameRate')
      ? [SUBTITLE_REASON_LABELS.differentFrameRate]
      : []),
    ...(subtitle.isMachineTranslated ? [say('screens.findSubtitlesDialog.machineTranslated')] : []),
  ].map((label): Check => ({ label, look: 'warns' }));

  if (
    subtitle.matches.length === 0 &&
    subtitle.misses.length === 0 &&
    subtitle.unknowns.length === 0
  ) {
    return [
      ...subtitle.reasons
        .filter((reason) => reason !== 'madeForThisFile' && reason !== 'differentFrameRate')
        .map((reason) => ({ label: SUBTITLE_REASON_LABELS[reason], look: 'matches' as const })),
      ...warnings,
    ];
  }

  return [
    ...SUBTITLE_CRITERIA.flatMap((criterion): Check[] =>
      subtitle.matches.includes(criterion)
        ? [{ label: SUBTITLE_CRITERION_LABELS[criterion], look: 'matches' as const }]
        : subtitle.misses.includes(criterion) && criterion !== 'frameRate'
          ? [{ label: SUBTITLE_CRITERION_LABELS[criterion], look: 'misses' as const }]
          : subtitle.unknowns.includes(criterion)
            ? [{ label: SUBTITLE_CRITERION_LABELS[criterion], look: 'unknowns' as const }]
            : [],
    ),
    ...warnings,
  ];
};

const CHECK_TONES = {
  matches: 'success',
  misses: 'danger',
  unknowns: 'ended',
  warns: 'warning',
} as const satisfies Record<Check['look'], BadgeTone>;

/**
 * Lays one subtitle found out as a row to pick: its release name, what it shares with this file
 * and what it does not, and down its right side the site it is from, whether it describes sounds
 * and how often it has been downloaded, above how well it matches.
 *
 * @param subtitle - The subtitle.
 * @param isFirst - Whether it heads the list, the best of them.
 * @returns The row.
 */
const choiceOf = (subtitle: FoundSubtitle, isFirst: boolean): Choice => {
  const checks = checksOf(subtitle);
  const note = subtitle.reasons.includes('madeForThisFile')
    ? SUBTITLE_REASON_LABELS.madeForThisFile
    : isFirst && subtitle.score > 0
      ? say('screens.chooseSourceDialog.bestMatch')
      : undefined;

  return {
    id: keyOf(subtitle),
    title: subtitle.name,
    ...(note === undefined ? {} : { note }),
    detail: (
      <>
        {checks.length === 0 ? null : (
          <span className="mt-2 flex flex-wrap gap-1.5">
            {checks.map((check) => (
              <Badge key={check.label} tone={CHECK_TONES[check.look]}>
                {check.label}
              </Badge>
            ))}
          </span>
        )}
      </>
    ),
    aside: (
      <span className="flex h-full flex-col items-end justify-between gap-3">
        <span className="flex flex-col items-end gap-1">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            {subtitle.isHearingImpaired ? (
              <Badge>{say('screens.findSubtitlesDialog.sdh')}</Badge>
            ) : null}
            {SUBTITLE_SITE_NAMES[subtitle.source]}
          </span>
          {subtitle.downloads === null ? null : (
            <span className="text-xs tabular-nums text-text-muted">
              {sayCount('common.count.downloads', subtitle.downloads)}
            </span>
          )}
        </span>
        <span
          className={cn(
            'text-sm font-medium tabular-nums',
            checks.some((check) => check.look === 'warns') ? 'text-warning' : 'text-text',
          )}
        >
          {say('client.library.describeFoundSubtitle.scoreMatch', {
            score: subtitle.score.toString(),
          })}
        </span>
      </span>
    ),
  };
};

/**
 * Says why subtitles cannot be found for a title: its server has no subtitle site, or it is on a
 * linked server that does not let this one search, is too old to be asked, or cannot be reached.
 *
 * @param finding - What the server that holds it said.
 * @returns What to tell somebody.
 */
const whyNotOf = ({ state, server }: SubtitleFinding): string =>
  state === 'notAllowed'
    ? say('screens.findSubtitlesDialog.serverDoesNotAllowThisServer', { server: server ?? '' })
    : state === 'notSupported'
      ? say('screens.findSubtitlesDialog.serverNeedsAnUpdate', { server: server ?? '' })
      : state === 'unreachable'
        ? say('screens.adminArea.linkedServersPanel.nameCouldNotBeReached', { name: server ?? '' })
        : server === null
          ? say('screens.findSubtitlesDialog.noSubtitleSiteIsSetUp')
          : say('screens.findSubtitlesDialog.serverHasNoSubtitleSite', { server });

/**
 * Says which sites a title's subtitles are looked for on, and on which server where it is not this
 * one.
 *
 * @param finding - What the server that holds it said.
 * @returns The line.
 */
const searchesOf = ({ sites, server }: SubtitleFinding): string => {
  const named = new Intl.ListFormat(undefined, { style: 'long', type: 'conjunction' }).format(
    sites.map((site) => SUBTITLE_SITE_NAMES[site]),
  );

  return server === null
    ? say('screens.findSubtitlesDialog.searchesSites', { sites: named })
    : say('screens.findSubtitlesDialog.searchesSitesOnServer', { sites: named, server });
};

/**
 * Looks for subtitles for one film or episode on the sites the server that holds its file has keys
 * for — this one, or the linked server it comes from, which searches and keeps it — in a language
 * chosen from the ones that server offers first, and adds the one picked, which the server keeps so
 * every app finds it. Where that server cannot search, it says why rather than offering nothing. They are listed best first, the best already picked, each ticking what it
 * shares with this file, crossing what it does not and warning of what would make it a poor choice,
 * with how well it matches out of 100, scored the way Bazarr scores them.
 *
 * @param media - The film or episode, by its id and name, or nothing while the dialog is shut.
 * @param onClose - Called when it is dismissed, or once a subtitle has been added.
 * @param onFetched - Told when a subtitle has been added, so what lists the subtitles can look
 *   again.
 */
const FindSubtitlesDialog = ({ media, onClose, onFetched }: FindSubtitlesDialogProps) => {
  const finding = useQuery({
    queryKey: ['subtitles', 'finding', media?.id ?? null],
    queryFn: () => readSubtitleFinding(media?.id ?? ''),
    enabled: media !== null,
    retry: false,
    staleTime: 0,
  });
  const canSearch = finding.data?.state === 'ready' || finding.isError;
  const preferred = finding.data?.languages ?? [];
  const [chosen, setChosen] = useState<string | null>(null);
  const language = chosen ?? preferred[0] ?? 'en';
  const [picked, setPicked] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const found = useQuery({
    queryKey: ['subtitles', 'found', media?.id ?? null, language],
    queryFn: () => findSubtitles(media?.id ?? '', language),
    enabled: media !== null && canSearch,
    retry: false,
    staleTime: 0,
  });
  const languages = [...new Set([...preferred, ...SUBTITLE_LANGUAGES])].map((code) => ({
    id: code,
    label: languageName(code),
  }));
  const title =
    media === null
      ? say('screens.findSubtitlesDialog.findSubtitles')
      : say('screens.findSubtitlesDialog.findSubtitlesForName', { name: media.name });
  const subtitles = found.data?.isSetUp === true ? found.data.subtitles : [];
  const chosenSubtitle =
    subtitles.find((subtitle) => keyOf(subtitle) === picked) ?? subtitles[0] ?? null;

  const close = () => {
    setPicked(null);
    setProblem(null);
    onClose();
  };

  const add = () => {
    if (media === null || chosenSubtitle === null) {
      return;
    }

    setIsAdding(true);
    setProblem(null);

    void fetchFoundSubtitle(media.id, {
      source: chosenSubtitle.source,
      id: chosenSubtitle.id,
      language,
    })
      .then((answer) => {
        if ('problem' in answer) {
          setProblem(answer.problem);

          return;
        }

        notify.worked(
          say('screens.findSubtitlesDialog.savedName', {
            name: languageName(language),
          }),
        );
        onFetched?.();
        close();
      })
      .finally(() => {
        setIsAdding(false);
      });
  };

  return (
    <DialogCompanion label={title} isOpen={media !== null} onClose={close}>
      <DialogTitle
        size="compact"
        title={title}
        detail={say('screens.findSubtitlesDialog.savedBesideTheVideo')}
      />

      <DialogContent className="flex flex-col gap-4">
        {finding.data !== undefined && !canSearch ? null : (
          <div className="flex items-end justify-between gap-4">
            <SelectField
              label={say('common.language')}
              options={languages}
              value={language}
              onSelect={(code) => {
                setChosen(code);
                setPicked(null);
                setProblem(null);
              }}
              className="w-56"
            />

            <span className="flex flex-col items-end gap-0.5 pb-2.5 text-end text-text-muted">
              {finding.data === undefined || finding.data.sites.length === 0 ? null : (
                <span className="text-xs">{searchesOf(finding.data)}</span>
              )}
              {subtitles.length === 0 ? null : (
                <span className="text-sm tabular-nums">
                  {sayCount('common.count.results', subtitles.length)}
                </span>
              )}
            </span>
          </div>
        )}

        {finding.data !== undefined && !canSearch ? (
          <p className="text-sm text-text-muted">{whyNotOf(finding.data)}</p>
        ) : found.isError ? (
          <CouldNotRead
            said={say('screens.findSubtitlesDialog.theSubtitleSitesCouldNotBe')}
            why={saidByTheServer(found.error)}
            isTryingAgain={found.isFetching}
            onTryAgain={() => {
              void found.refetch();
            }}
          />
        ) : finding.isPending || found.data === undefined ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: WAITING_ROWS }, (_, at) => (
              <Skeleton
                key={at}
                {...(at === 0 ? { label: say('screens.findSubtitlesDialog.looking') } : {})}
                className="h-[4.5rem] w-full"
              />
            ))}
          </div>
        ) : !found.data.isSetUp ? (
          <p className="text-sm text-text-muted">
            {say('screens.findSubtitlesDialog.noSubtitleSiteIsSetUp')}
          </p>
        ) : subtitles.length === 0 ? (
          <p className="text-sm text-text-muted">
            {say('screens.findSubtitlesDialog.nothingWasFoundInThatLanguage')}
          </p>
        ) : (
          <ChoiceList
            label={say('screens.findSubtitlesDialog.subtitlesFound')}
            choices={subtitles.map((subtitle, at) => choiceOf(subtitle, at === 0))}
            value={chosenSubtitle === null ? null : keyOf(chosenSubtitle)}
            onChoose={(key) => {
              setPicked(key);
              setProblem(null);
            }}
          />
        )}
      </DialogContent>

      <DialogFooter
        note={problem}
        dismiss={{ onChoose: close }}
        confirm={{
          label: say('screens.findSubtitlesDialog.addSubtitles'),
          onChoose: add,
          isLoading: isAdding,
          isDisabled: chosenSubtitle === null,
        }}
      />
    </DialogCompanion>
  );
};

FindSubtitlesDialog.displayName = 'FindSubtitlesDialog';

export { FindSubtitlesDialog };

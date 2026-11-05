import { useEffect, useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { Spinner } from '@ValenceUI/Spinner';
import { scoreOfMatch } from '@ValenceClient/admin/scoreOfMatch';
import { fetchTitleCandidates } from '@ValenceClient/admin/fetchTitleCandidates';
import { correctMatch } from '@ValenceClient/library/fetchLibrary';
import { CatalogueMatchList } from '@ValenceScreens/components/AdminArea/components/CatalogueMatchList/CatalogueMatchList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { QuickMatchTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/QuickMatchDialog/QuickMatchDialog.types';
import type { MatchReviewProps } from './MatchReview.types';
import { say } from '@ValenceI18n/say';

type Found = { kind: 'found'; matches: CatalogueMatch[] } | { kind: 'failed'; problem: string };

/**
 * A title as it is named in a list, with its year where known.
 *
 * @param name - Its name.
 * @param year - Its year.
 * @returns The two together.
 */
const namedWithYear = (name: string, year: number | null): string =>
  year === null ? name : `${name} (${year.toString()})`;

/**
 * What TMDB holds for a title, best fit first.
 *
 * @param title - The title.
 * @returns The entries, or why none could be read.
 */
const findFor = async (title: QuickMatchTitle): Promise<Found> => {
  const found = await fetchTitleCandidates(title.name, title.kind, 1);

  if ('problem' in found) {
    return { kind: 'failed', problem: found.problem };
  }

  const wanted = { title: title.name, year: title.year };

  return {
    kind: 'found',
    matches: found.matches
      .map((match) => ({ match, score: scoreOfMatch(wanted, match) }))
      .sort((one, other) => other.score - one.score)
      .map((one) => one.match),
  };
};

/**
 * Steps through titles one at a time, as Calibre reviews its matches: each shows what TMDB holds
 * for it, best fit first, and choosing one matches the title to it and moves on. A title can be
 * skipped or gone back to, and the rest can be matched to their best fits, or left, at once.
 *
 * @param titles - The titles to review.
 * @param onMatched - Told each title matched, and what to.
 * @param onDone - Told the review is over.
 */
const MatchReview = ({ titles, onMatched, onDone }: MatchReviewProps) => {
  const [at, setAt] = useState(0);
  const [found, setFound] = useState<ReadonlyMap<string, Found>>(new Map());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAcceptingRest, setIsAcceptingRest] = useState(false);
  const title = titles[at];
  const here = title === undefined ? undefined : found.get(title.mediaId);

  useEffect(() => {
    if (title === undefined || found.has(title.mediaId)) {
      return;
    }

    let isCurrent = true;

    void findFor(title).then((answer) => {
      if (isCurrent) {
        setFound((held) => new Map(held).set(title.mediaId, answer));
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [found, title]);

  const next = () => {
    if (at + 1 >= titles.length) {
      onDone();
    } else {
      setAt(at + 1);
    }
  };

  const accept = async (one: QuickMatchTitle, match: CatalogueMatch): Promise<boolean> => {
    const corrected = await correctMatch(one.mediaId, match.externalId, one.kind);

    if ('problem' in corrected) {
      return false;
    }

    onMatched(one.mediaId, namedWithYear(match.title, match.year));

    return true;
  };

  const acceptRest = async () => {
    setIsAcceptingRest(true);

    for (const one of titles.slice(at)) {
      const answer = found.get(one.mediaId) ?? (await findFor(one));
      const [best] = answer.kind === 'found' ? answer.matches : [];

      if (best !== undefined) {
        await accept(one, best);
      }
    }

    setIsAcceptingRest(false);
    onDone();
  };

  if (title === undefined) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-body text-sm font-medium text-text">
          {namedWithYear(title.name, title.year)}
        </span>
        <span className="font-body text-xs tabular-nums text-text-muted">
          {say('screens.adminArea.quickMatch.atOfCount', {
            at: (at + 1).toLocaleString(),
            count: titles.length.toLocaleString(),
          })}
        </span>
      </div>
      <p className="font-body text-sm text-text-muted">
        {say('screens.adminArea.quickMatch.chooseWhatItIs')}
      </p>
      {here === undefined ? (
        <Spinner size="sm" label={say('screens.adminArea.quickMatch.lookingNow')} />
      ) : here.kind === 'failed' ? (
        <p className="font-body text-sm text-danger">{here.problem}</p>
      ) : here.matches.length === 0 ? (
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.fixMatchDialog.nothingCameBackForQuery', { query: title.name })}
        </p>
      ) : (
        <CatalogueMatchList
          matches={here.matches}
          busyId={busyId}
          scoreOf={(match) => scoreOfMatch({ title: title.name, year: title.year }, match)}
          onChoose={(match) => {
            setBusyId(match.externalId);
            void accept(title, match).then((isMatched) => {
              setBusyId(null);

              if (isMatched) {
                next();
              }
            });
          }}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={at === 0 || isAcceptingRest}
          onClick={() => {
            setAt(at - 1);
          }}
        >
          {say('common.previous')}
        </Button>
        <Button variant="secondary" size="sm" disabled={isAcceptingRest} onClick={next}>
          {say('common.skip')}
        </Button>
        <span className="flex-1" />
        <Button variant="ghost" size="sm" disabled={isAcceptingRest} onClick={onDone}>
          {say('screens.adminArea.quickMatch.skipTheRest')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isLoading={isAcceptingRest}
          onClick={() => {
            void acceptRest();
          }}
        >
          {say('screens.adminArea.quickMatch.acceptTheBestFitForTheRest')}
        </Button>
      </div>
    </div>
  );
};

MatchReview.displayName = 'MatchReview';

export { MatchReview };

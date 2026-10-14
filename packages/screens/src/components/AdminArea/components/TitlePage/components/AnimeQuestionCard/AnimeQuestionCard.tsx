import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { describeAnimeReading } from '@ValenceClient/requests/describeAnimeReading';
import type { AnimeQuestionCardProps } from './AnimeQuestionCard.types';
import { say } from '@ValenceI18n/say';

/**
 * Where an anime release waits on the operator because its numbers could mean more than one set of
 * episodes: the release, each way it could be read — the best guess marked — to fetch it read that
 * way, whether to read its release group's releases the same way from now on, and a way to let it
 * go.
 *
 * @param question - The question.
 * @param isBusy - Whether an answer is being sent.
 * @param onAnswer - Told how the release numbers its episodes, and whether to remember it.
 * @param onDismiss - Told to let it go.
 */
const AnimeQuestionCard = ({ question, isBusy, onAnswer, onDismiss }: AnimeQuestionCardProps) => {
  const [isRemembered, setIsRemembered] = useState(question.group !== null);

  return (
    <section
      aria-label={question.release.title}
      className="flex flex-col gap-3 rounded-2xl border border-[var(--surface-line)] bg-surface-raised p-5"
    >
      <span className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text">
          {say('screens.adminArea.titlePage.animeQuestionCard.whichEpisodeIsThis')}
        </span>
        <span className="break-all font-mono text-xs text-text-muted">
          {question.release.title}
        </span>
        <span className="text-sm text-text-muted">
          {say('screens.adminArea.titlePage.animeQuestionCard.itCouldBeEither')}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-2">
        {question.readings.map((reading) => (
          <span key={reading.numbering} className="flex items-center gap-2">
            <Button
              variant={reading.numbering === question.guess ? 'primary' : 'secondary'}
              size="sm"
              disabled={isBusy}
              onClick={() => {
                onAnswer(reading.numbering, isRemembered && question.group !== null);
              }}
            >
              {describeAnimeReading(reading)}
            </Button>
            {reading.numbering === question.guess ? (
              <Badge size="sm" tone="quiet">
                {say('screens.adminArea.titlePage.animeQuestionCard.bestGuess')}
              </Badge>
            ) : null}
          </span>
        ))}
      </span>

      <span className="flex flex-wrap items-center justify-between gap-3">
        {question.group === null ? (
          <span />
        ) : (
          <Checkbox
            label={say('screens.adminArea.titlePage.animeQuestionCard.readGroupsReleasesThisWay', {
              group: question.group,
            })}
            checked={isRemembered}
            disabled={isBusy}
            onCheckedChange={setIsRemembered}
          />
        )}
        <Button variant="ghost" size="sm" disabled={isBusy} onClick={onDismiss}>
          {say('screens.adminArea.titlePage.animeQuestionCard.notThisOne')}
        </Button>
      </span>
    </section>
  );
};

AnimeQuestionCard.displayName = 'AnimeQuestionCard';

export { AnimeQuestionCard };

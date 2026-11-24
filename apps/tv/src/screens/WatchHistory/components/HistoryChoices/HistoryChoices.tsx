import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { findTheEpisodeAfter } from '@ValenceClient/library/findTheEpisodeAfter';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { ChoicePanel } from '@ValenceTv/components/ChoicePanel/ChoicePanel';
import { useMenuToClose } from '@ValenceTv/navigation/useMenuToClose';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { HistoryChoicesProps } from './HistoryChoices.types';
import { say } from '@ValenceI18n/say';

type Found = { after: string; next: MediaSummary | null };

/**
 * What can be done with a film or a programme from the watch history, in the panel down the right:
 * resume it from where it was left, play the next episode where the episode watched last was
 * finished, play it from the beginning, go to its page, or take it off the history, which asks first.
 * Where the next episode is being looked for, the panel waits for it, so no choice moves under the
 * remote. Menu closes it.
 *
 * @param watched - The film or programme, and its latest viewing.
 * @param progress - How far through each thing this viewer is.
 * @param onPlay - Told what to play, and from where.
 * @param onOpen - Told which film or programme's page to open.
 * @param onForget - Told to take the film or programme off the history.
 * @param onClose - Told to put the panel away.
 */
const HistoryChoices = ({
  watched,
  progress,
  onPlay,
  onOpen,
  onForget,
  onClose,
}: HistoryChoicesProps) => {
  const cache = useQueryClient();
  const { latest } = watched;
  const isEpisode = latest.seriesTitle !== null;
  const name = latest.seriesTitle ?? latest.title ?? say('common.something');
  const resume = resumeFor(progress, latest.mediaItemId);
  const known = progress.get(latest.mediaItemId);
  const isDone = known === undefined ? latest.isFinished : known.isFinished;
  const wantsNext = isEpisode && isDone && resume === null;
  const [found, setFound] = useState<Found | null>(null);

  useMenuToClose(onClose);

  useEffect(() => {
    if (!wantsNext) {
      return;
    }

    let isWanted = true;
    const after = latest.mediaItemId;

    void findTheEpisodeAfter(cache, latest, progress)
      .catch(() => null)
      .then((next) => {
        if (isWanted) {
          setFound({ after, next });
        }
      });

    return () => {
      isWanted = false;
    };
  }, [wantsNext, cache, latest, progress]);

  const next = wantsNext && found?.after === latest.mediaItemId ? found.next : null;

  if (wantsNext && found?.after !== latest.mediaItemId) {
    return null;
  }

  return (
    <ChoicePanel
      title={name}
      onClose={onClose}
      choices={[
        ...(resume === null
          ? []
          : [
              {
                id: 'resume',
                label: say('common.resumeFromResume', { resume: formatDuration(resume) }),
                isCurrent: false,
              },
            ]),
        ...(next === null
          ? []
          : [
              {
                id: 'next',
                label: say('tv.watchHistory.historyChoices.playTheNextEpisode'),
                detail: say('tv.placeOfEpisode.sValueEValue2', {
                  value: (next.seasonNumber ?? 1).toString(),
                  value2: describeEpisodeNumbers(next.episodeNumber ?? 1, next.episodeNumberEnd),
                }),
                isCurrent: false,
              },
            ]),
        { id: 'start', label: say('tv.filmPage.playFromTheBeginning'), isCurrent: false },
        {
          id: 'page',
          label: isEpisode
            ? say('tv.watchHistory.historyChoices.goToTheShow')
            : say('tv.watchHistory.historyChoices.goToTheFilm'),
          isCurrent: false,
        },
        {
          id: 'forget',
          label: say('tv.watchHistory.historyChoices.removeFromHistory'),
          isCurrent: false,
        },
      ]}
      onChoose={(id) => {
        onClose();

        switch (id) {
          case 'resume':
            onPlay(latest.mediaItemId, resume ?? 0);
            break;
          case 'next':
            if (next !== null) {
              onPlay(next.id, 0);
            }
            break;
          case 'start':
            onPlay(latest.mediaItemId, 0);
            break;
          case 'page':
            onOpen({
              kind: isEpisode ? 'show' : 'film',
              mediaId: latest.mediaItemId,
              seriesId: latest.seriesId,
            });
            break;
          default:
            Alert.alert(
              say('common.forgetTitle', { title: name }),
              say('phone.theAccount.theHistory.itIsTakenOffYourHistory'),
              [
                { text: say('common.keepIt'), style: 'cancel' },
                {
                  text: say('common.forget'),
                  style: 'destructive',
                  onPress: () => {
                    onForget(watched);
                  },
                },
              ],
            );
        }
      }}
    />
  );
};

HistoryChoices.displayName = 'HistoryChoices';

export { HistoryChoices };

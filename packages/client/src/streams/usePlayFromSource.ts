import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { streamQueries } from '@ValenceClient/query/streamQueries';
import { say } from '@ValenceI18n/say';
import type { StreamOffer } from '@ValenceContracts/schemas/StreamOffer';
import { fetchStreamOffers } from './fetchStreamOffers';
import { pickStreamOffer } from './pickStreamOffer';
import type { Screen } from './pickStreamOffer';
import { playStream } from './playStream';

/**
 * Playing a film straight from a source, the way the film's page offers it: Play looks for its
 * streams, chooses the best for this screen and plays it — trying the next best once, quietly, if
 * the one chosen will not start — and opens the picker instead where none can start straight
 * away. Sources lets somebody choose for themselves, and a stream they chose never falls back
 * behind their back; they are told why it would not play.
 *
 * @param tmdbId - The film.
 * @param screen - What this device shows and plays, for choosing on its behalf.
 * @param onPlay - Called with the title to play once a stream has started.
 * @returns What the page needs to draw the buttons and the picker.
 */
const usePlayFromSource = (
  tmdbId: number | null,
  screen: Screen,
  onPlay: (mediaId: string) => void,
) => {
  const cache = useQueryClient();
  const [isAsked, setIsAsked] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const offers = useQuery(streamQueries.offers(tmdbId ?? 0, isAsked && tmdbId !== null));
  const best = pickStreamOffer(offers.data?.offers ?? [], screen);

  const play = async (offerId: string, fallbacks: readonly StreamOffer[]): Promise<void> => {
    setIsStarting(true);
    setProblem(null);

    try {
      const played = await playStream(offerId);

      if (played.kind === 'ready') {
        setIsPickerOpen(false);
        onPlay(played.mediaId);

        return;
      }

      if (played.kind === 'preparing') {
        setProblem(say('client.streams.usePlayFromSource.theSourceIsStillGettingIt'));

        return;
      }

      const [next, ...rest] = fallbacks;

      if (next !== undefined && !played.isGone) {
        await play(next.id, rest);

        return;
      }

      if (played.isGone) {
        void cache.invalidateQueries({
          queryKey: streamQueries.offers(tmdbId ?? 0, true).queryKey,
        });
      }

      setProblem(played.message);
    } finally {
      setIsStarting(false);
    }
  };

  return {
    start: () => {
      if (tmdbId === null) {
        return;
      }

      setIsAsked(true);
      setIsFinding(true);
      setProblem(null);

      void cache
        .fetchQuery(streamQueries.offers(tmdbId, true))
        .then(async (found) => {
          const chosen = pickStreamOffer(found.offers, screen);

          if (chosen === null) {
            if (found.offers.length === 0) {
              setProblem(say('client.streams.usePlayFromSource.noSourceHasThisFilmRight'));
            } else {
              setIsPickerOpen(true);
            }

            return;
          }

          const second = pickStreamOffer(
            found.offers.filter((offer) => offer.id !== chosen.id),
            screen,
          );

          await play(chosen.id, second === null ? [] : [second]);
        })
        .catch(() => {
          setProblem(say('client.streams.usePlayFromSource.couldNotLookForSources'));
        })
        .finally(() => {
          setIsFinding(false);
        });
    },
    choose: (offerId: string) => {
      void play(offerId, []);
    },
    lookAgain: () => {
      if (tmdbId !== null) {
        setIsAsked(true);
        void cache
          .fetchQuery({
            ...streamQueries.offers(tmdbId, true),
            queryFn: () => fetchStreamOffers(tmdbId, true),
            staleTime: 0,
          })
          .catch(() => null);
      }
    },
    openPicker: () => {
      setIsAsked(true);
      setIsPickerOpen(true);
    },
    closePicker: () => {
      setIsPickerOpen(false);
    },
    isFinding,
    isStarting,
    isPickerOpen,
    problem,
    offers,
    bestId: best?.id ?? null,
  };
};

export { usePlayFromSource };

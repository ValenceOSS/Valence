import { useLayoutEffect, useRef, useState } from 'react';
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
 * the one chosen will not start, unless this viewer may not play the film at all — and opens the
 * picker instead where none can start straight away or a source could not say. Sources lets
 * somebody choose for themselves, and a stream they chose never falls back behind their back;
 * they are told why it would not play. Each film starts afresh, and an attempt somebody has walked
 * away from, by closing the picker, leaving the page or opening another film, plays nothing when
 * it comes back.
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
  const [shownFor, setShownFor] = useState(tmdbId);
  const [isAsked, setIsAsked] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const attempt = useRef(0);
  const offers = useQuery(streamQueries.offers(tmdbId ?? 0, isAsked && tmdbId !== null));
  const best = pickStreamOffer(offers.data?.offers ?? [], screen);

  if (shownFor !== tmdbId) {
    setShownFor(tmdbId);
    setIsAsked(false);
    setIsPickerOpen(false);
    setIsStarting(false);
    setIsFinding(false);
    setProblem(null);
  }

  useLayoutEffect(() => {
    attempt.current += 1;

    return () => {
      attempt.current += 1;
    };
  }, [tmdbId]);

  const play = async (
    offerId: string,
    fallbacks: readonly StreamOffer[],
    isLatest: () => boolean,
  ): Promise<void> => {
    setIsStarting(true);
    setProblem(null);

    try {
      const played = await playStream(offerId);

      if (!isLatest()) {
        return;
      }

      if (played.kind === 'ready') {
        setIsPickerOpen(false);
        onPlay(played.mediaId);

        return;
      }

      const [next, ...rest] = fallbacks;
      const mayFallBack =
        next !== undefined &&
        (played.kind === 'preparing' || (!played.isGone && !played.isForbidden));

      if (mayFallBack) {
        await play(next.id, rest, isLatest);

        return;
      }

      if (played.kind === 'preparing') {
        setProblem(say('client.streams.usePlayFromSource.theSourceIsStillGettingIt'));

        return;
      }

      if (played.isGone) {
        void cache.invalidateQueries({
          queryKey: streamQueries.offers(tmdbId ?? 0, true).queryKey,
        });
      }

      setProblem(played.message);
    } finally {
      if (isLatest()) {
        setIsStarting(false);
      }
    }
  };

  /**
   * Starts a new attempt, so whatever an earlier one finds out later is dropped, and nothing waits
   * on it any longer.
   *
   * @returns Whether the attempt is still the latest when asked.
   */
  const newAttempt = (): (() => boolean) => {
    attempt.current += 1;
    setIsFinding(false);
    setIsStarting(false);

    const mine = attempt.current;

    return () => attempt.current === mine;
  };

  return {
    start: () => {
      if (tmdbId === null) {
        return;
      }

      const isLatest = newAttempt();

      setIsAsked(true);
      setIsFinding(true);
      setProblem(null);

      void cache
        .fetchQuery(streamQueries.offers(tmdbId, true))
        .then(async (found) => {
          if (!isLatest()) {
            return;
          }

          const chosen = pickStreamOffer(found.offers, screen);

          if (chosen === null) {
            if (found.offers.length === 0 && found.problems.length === 0) {
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

          await play(chosen.id, second === null ? [] : [second], isLatest);
        })
        .catch(() => {
          if (isLatest()) {
            setProblem(say('client.streams.usePlayFromSource.couldNotLookForSources'));
          }
        })
        .finally(() => {
          if (isLatest()) {
            setIsFinding(false);
          }
        });
    },
    choose: (offerId: string) => {
      void play(offerId, [], newAttempt());
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
      attempt.current += 1;
      setIsPickerOpen(false);
      setIsFinding(false);
      setIsStarting(false);
    },
    isFinding,
    isStarting,
    isPickerOpen,
    isLooking: offers.isFetching && offers.data === undefined,
    isFailed: offers.isError && !offers.isFetching,
    problem,
    offers,
    bestId: best?.id ?? null,
  };
};

export { usePlayFromSource };

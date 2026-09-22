import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { profileQueries } from '@ValenceClient/query/profileQueries';
import { decideWhatFollows } from '@ValenceClient/playback/decideWhatFollows';
import { nextEpisode } from '@ValenceClient/library/pickFeatured';
import {
  STILL_WATCHING_ANSWER_SECONDS,
  STILL_WATCHING_OFF,
} from '@ValenceContracts/schemas/StillWatching';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { signOut } from '@ValenceClient/session/auth';
import { watchPresence } from '@ValenceClient/presence/watchPresence';
import { AShow } from '@ValencePhone/components/AShow/AShow';
import { ATitle } from '@ValencePhone/components/ATitle/ATitle';
import { Screen } from '@ValencePhone/components/Screen/Screen';
import { StillWatching } from '@ValencePhone/components/StillWatching/StillWatching';
import { TheLibrary } from '@ValencePhone/components/TheLibrary/TheLibrary';
import { Watching } from '@ValencePhone/components/Watching/Watching';
import type { SignedInProps } from './SignedIn.types';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * What a phone shows once somebody is through: the library, a title or a programme out of it, or
 * something playing.
 *
 * Where they are is held here rather than in an address, because a phone has no address bar and
 * three screens do not need a router to tell them apart. It will when there are more.
 *
 * Coming out of the player throws away what was known about how far through everything is, because
 * the thing they just watched is the one entry that is now wrong.
 *
 * When an episode plays to its end the next one in its season follows on its own, as it does on
 * the browser client, until as many have followed as this profile allows — then it asks first, and
 * asks instead of playing rather than over the top of something already started. Choosing an
 * episode by hand starts that count again.
 *
 * It joins presence as soon as somebody is through, which is what puts this phone in the list of
 * open sessions an operator watches and what carries an instruction to stop or pause back to it.
 * Presence is the socket rather than something kept beside one, so a phone that never opened one
 * was a phone the server could see asking for films and never see watching them.
 *
 * Waits for the session before drawing any of it, because every request they make depends on being
 * signed in and a library drawn first would ask a question it cannot have the answer to.
 *
 * @param onOut - Told once they have signed out.
 */
const SignedIn = ({ onOut }: SignedInProps) => {
  const session = useQuery(sessionQueries.who());

  useEffect(() => watchPresence(), []);
  const cache = useQueryClient();
  const [looking, setLooking] = useState<string | null>(null);
  const [programme, setProgramme] = useState<{ libraryId: string; showId: string } | null>(null);
  const [watching, setWatching] = useState<{ mediaId: string; startSeconds: number } | null>(null);
  const [carriedOn, setCarriedOn] = useState(0);
  const [askingAbout, setAskingAbout] = useState<MediaSummary | null>(null);
  const series = useQuery(
    libraryQueries.show(programme?.libraryId ?? null, programme?.showId ?? null),
  );
  const watcher = useQuery(profileQueries.watching());
  const episodes = series.data?.seasons.flatMap((season) => season.episodes) ?? [];

  const choose = (mediaId: string, startSeconds: number) => {
    setCarriedOn(0);
    setWatching({ mediaId, startSeconds });
  };

  const stopWatchingIt = () => {
    setWatching(null);
    void cache.invalidateQueries({ queryKey: viewingQueries.progress().queryKey });
  };

  const whenItEnds = () => {
    const playing = episodes.find((episode) => episode.id === watching?.mediaId) ?? null;
    const decided = decideWhatFollows({
      following: playing === null ? null : nextEpisode(episodes, playing),
      carriedOn,
      askAfter: watcher.data?.askStillWatchingAfter ?? STILL_WATCHING_OFF,
    });

    if (decided.kind === 'nothing') {
      stopWatchingIt();

      return;
    }

    if (decided.kind === 'ask') {
      stopWatchingIt();
      setAskingAbout(decided.episode);

      return;
    }

    setCarriedOn((was) => was + 1);
    setWatching({ mediaId: decided.episode.id, startSeconds: 0 });
  };

  if (session.isPending) {
    return (
      <Screen centres>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (askingAbout !== null) {
    return (
      <StillWatching
        upNext={askingAbout.title}
        secondsToAnswer={STILL_WATCHING_ANSWER_SECONDS}
        onCarryOn={() => {
          const next = askingAbout;

          setAskingAbout(null);
          choose(next.id, 0);
        }}
        onStop={() => {
          setAskingAbout(null);
        }}
      />
    );
  }

  if (watching !== null) {
    return (
      <Watching
        key={watching.mediaId}
        mediaId={watching.mediaId}
        startSeconds={watching.startSeconds}
        onDone={stopWatchingIt}
        onEnded={whenItEnds}
      />
    );
  }

  if (programme !== null) {
    return (
      <AShow
        libraryId={programme.libraryId}
        showId={programme.showId}
        onWatch={choose}
        onBack={() => {
          setProgramme(null);
        }}
      />
    );
  }

  if (looking !== null) {
    return (
      <ATitle
        mediaId={looking}
        onWatch={choose}
        onBack={() => {
          setLooking(null);
        }}
      />
    );
  }

  return (
    <TheLibrary
      onLookAt={setLooking}
      onLookAtShow={(libraryId, showId) => {
        setProgramme({ libraryId, showId });
      }}
      onOut={() => {
        void signOut().then(onOut);
      }}
    />
  );
};

SignedIn.displayName = 'SignedIn';

export { SignedIn };

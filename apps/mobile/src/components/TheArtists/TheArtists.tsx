import { Mic } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { artistImageUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { TheArtistsProps } from './TheArtists.types';
import { say } from '@ValenceI18n/say';

const WHICH = [
  { id: 'all', label: say('common.everyone') },
  { id: 'followed', label: say('common.following') },
] as const;

const ACROSS = 2;

/**
 * Every artist in the music libraries, as the web's artists page lays them out: a grid of faces, of
 * everyone or only the ones somebody follows.
 *
 * @param onArtist - Told which artist to open.
 * @param onBack - Told somebody is done with it.
 */
const TheArtists = ({ onArtist, onBack }: TheArtistsProps) => {
  const colours = useTheColours();
  const [isFollowedOnly, setIsFollowedOnly] = useState(false);
  const artists = useQuery(musicQueries.artists(isFollowedOnly));

  return (
    <APosterGrid
      onBack={onBack}
      across={ACROSS}
      header={
        <>
          <Words size="title">{say('common.artists')}</Words>
          <SegmentedRow
            label={say('common.whichArtistsToShow')}
            items={WHICH}
            value={isFollowedOnly ? 'followed' : 'all'}
            onSelect={(id) => {
              setIsFollowedOnly(id === 'followed');
            }}
          />
          {artists.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}
          {!artists.isPending && (artists.data ?? []).length === 0 ? (
            isFollowedOnly ? (
              <ANothingHere
                of={Mic}
                title={say('common.notFollowingAnybodyYet')}
                detail={say('common.followAnArtistFromTheirPage')}
              />
            ) : (
              <ANothingHere
                of={Mic}
                title={say('common.noArtistsYet')}
                detail={say('common.onceAMusicLibraryHasBeen2')}
              />
            )
          ) : null}
        </>
      }
      items={artists.data ?? []}
      keyOf={(artist) => artist.id}
      drawn={(artist, width) => (
        <AMusicTile
          title={artist.name}
          artwork={artist.hasImage ? onThisServer(artistImageUrl(artist.id)) : null}
          isRound
          side={width}
          onPress={() => {
            onArtist(artist.id);
          }}
        />
      )}
    />
  );
};

TheArtists.displayName = 'TheArtists';

export { TheArtists };

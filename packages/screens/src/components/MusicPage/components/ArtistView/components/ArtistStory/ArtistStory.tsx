import { useQuery } from '@tanstack/react-query';
import { Link } from '@ValenceUI/Link';
import { ReadMore } from '@ValenceUI/ReadMore';
import { RevealItem } from '@ValenceUI/RevealItem';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { RELEASE_TYPE_NAMES } from '@ValenceClient/requests/RELEASE_TYPE_NAMES';
import { MusicArtwork } from '@ValenceScreens/components/MusicArtwork/MusicArtwork';
import { MusicShelf } from '@ValenceScreens/components/MusicShelf/MusicShelf';
import { MusicTile } from '@ValenceScreens/components/MusicTile/MusicTile';
import { MUSIC_LANES } from '@ValenceScreens/music/musicLanes';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { askingOf } from '@ValenceScreens/requests/askingOf';
import { useMayRequest } from '@ValenceClient/requests/useMayRequest';
import type { ArtistStoryProps } from './ArtistStory.types';
import { say } from '@ValenceI18n/say';

/**
 * What an artist's page says beyond the songs of theirs in the library: a few sentences about them,
 * from the Wikipedia article they are linked to, and — for whoever may ask for music — the albums
 * and EPs of theirs the library does not have yet, each opening the request for it.
 *
 * Nothing is drawn while it is being found, or where nothing was, so a page for an artist nobody
 * has written about looks as it always did.
 *
 * @param artistId - The artist.
 * @param name - What they are called.
 */
const ArtistStory = ({ artistId, name }: ArtistStoryProps) => {
  const story = useQuery(musicQueries.artistStory(artistId));
  const mayRequest = useMayRequest();
  const { go } = usePlace();

  if (story.data === undefined) {
    return null;
  }

  const { bio, sourceUrl, missing } = story.data;

  return (
    <>
      {bio === null ? null : (
        <section
          aria-label={say('common.aboutName', { name })}
          className={`flex flex-col gap-3 ${MUSIC_LANES.tracks}`}
        >
          <h2 className="px-3 text-lg font-semibold tracking-tight text-text">
            {say('common.about')}
          </h2>
          <div className="flex max-w-3xl flex-col gap-2 px-3">
            <ReadMore
              lines={4}
              className="font-body text-[0.9375rem] leading-relaxed text-text-muted"
            >
              {bio}
            </ReadMore>
            {sourceUrl === null ? null : (
              <Link href={sourceUrl} className="w-fit font-body text-xs text-text-muted">
                {say('common.fromWikipedia')}
              </Link>
            )}
          </div>
        </section>
      )}

      {!mayRequest || missing.length === 0 ? null : (
        <MusicShelf heading={say('common.moreFromName', { name })}>
          {missing.map((album, at) => (
            <RevealItem key={album.releaseGroupId} index={at}>
              <MusicTile
                title={album.title}
                detail={[
                  album.year?.toString(),
                  album.type === null ? undefined : RELEASE_TYPE_NAMES[album.type].one,
                  say('common.notInYourLibrary'),
                ]
                  .filter((part) => part !== undefined)
                  .join(' · ')}
                artwork={
                  <MusicArtwork src={album.coverUrl} label={album.title} className="w-full" />
                }
                onOpen={() => {
                  go({ asking: askingOf({ kind: 'album', id: album.releaseGroupId }) });
                }}
              />
            </RevealItem>
          ))}
        </MusicShelf>
      )}
    </>
  );
};

ArtistStory.displayName = 'ArtistStory';

export { ArtistStory };

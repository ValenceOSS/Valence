import { Record } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValenceMobile/components/AMusicTile/AMusicTile';
import { ANothingHere } from '@ValenceMobile/components/ANothingHere/ANothingHere';
import { APosterGrid } from '@ValenceMobile/components/APosterGrid/APosterGrid';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { say } from '@ValenceI18n/say';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';
import type { TheAlbumsProps } from './TheAlbums.types';
import type { StringKey } from '@ValenceI18n/StringKey';

const ORDERS: readonly { id: AlbumOrder; said: StringKey }[] = [
  { id: 'recent', said: 'phone.theAlbums.recent' },
  { id: 'title', said: 'phone.theAlbums.byName' },
  { id: 'year', said: 'phone.theAlbums.year' },
];

const ACROSS = 2;

/**
 * Every album in the music libraries, as the web's albums page lays them out: a grid of covers, put
 * in order by when they arrived, by name or by year.
 *
 * @param onAlbum - Told which album to open.
 * @param onBack - Told somebody is done with it.
 */
const TheAlbums = ({ onAlbum, onBack }: TheAlbumsProps) => {
  const colours = useTheColours();
  const [order, setOrder] = useState<AlbumOrder>('recent');
  const albums = useQuery(musicQueries.albums(order));

  return (
    <APosterGrid
      onBack={onBack}
      across={ACROSS}
      header={
        <>
          <Words size="title">{say('phone.theAlbums.title')}</Words>
          <SegmentedRow
            label={say('phone.theAlbums.orderLabel')}
            items={ORDERS.map((one) => ({ id: one.id, label: say(one.said) }))}
            value={order}
            onSelect={(id) => {
              setOrder(ORDERS.find((one) => one.id === id)?.id ?? 'recent');
            }}
          />
          {albums.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}
          {!albums.isPending && (albums.data ?? []).length === 0 ? (
            <ANothingHere
              of={Record}
              title={say('phone.theAlbums.emptyTitle')}
              detail={say('phone.theAlbums.emptyDetail')}
            />
          ) : null}
        </>
      }
      items={albums.data ?? []}
      keyOf={(album) => album.id}
      drawn={(album, width) => (
        <AMusicTile
          title={album.title}
          detail={album.artist.name}
          artwork={album.hasArtwork ? onThisServer(albumArtworkUrl(album.id)) : null}
          side={width}
          onPress={() => {
            onAlbum(album.id);
          }}
        />
      )}
    />
  );
};

TheAlbums.displayName = 'TheAlbums';

export { TheAlbums };

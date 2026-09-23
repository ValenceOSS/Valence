import { Record } from '@keyline-icons/react-native';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator } from 'react-native';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { AMusicTile } from '@ValencePhone/components/AMusicTile/AMusicTile';
import { ANothingHere } from '@ValencePhone/components/ANothingHere/ANothingHere';
import { APosterGrid } from '@ValencePhone/components/APosterGrid/APosterGrid';
import { SegmentedRow } from '@ValencePhone/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValencePhone/components/Words/Words';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AlbumOrder } from '@ValenceClient/music/fetchMusic';
import type { TheAlbumsProps } from './TheAlbums.types';

const ORDERS: readonly { id: AlbumOrder; label: string }[] = [
  { id: 'recent', label: 'Recently added' },
  { id: 'title', label: 'A–Z' },
  { id: 'year', label: 'Year' },
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
          <Words size="title">Albums</Words>
          <SegmentedRow
            label="Put the albums in order by"
            items={ORDERS}
            value={order}
            onSelect={(id) => {
              setOrder(ORDERS.find((one) => one.id === id)?.id ?? 'recent');
            }}
          />
          {albums.isPending ? <ActivityIndicator color={colours.textMuted} /> : null}
          {!albums.isPending && (albums.data ?? []).length === 0 ? (
            <ANothingHere
              of={Record}
              title="No albums yet"
              detail="Once a music library has been scanned, its albums will be here."
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

import { describe, expect, it } from 'vitest';
import { arrApp } from '#dialect/Schema';
import { aScratchDatabase } from '#dialect/aScratchDatabase';
import { createDatabaseDownloadClientStore } from '@ValenceRequests/downloads/createDatabaseDownloadClientStore';
import { createDatabaseSentDownloadStore } from '@ValenceRequests/downloads/createDatabaseSentDownloadStore';
import { createDatabaseMediaRequestStore } from '@ValenceRequests/mediaRequests/createDatabaseMediaRequestStore';
import { createDatabaseRequestItemStore } from '@ValenceRequests/mediaRequests/createDatabaseRequestItemStore';
import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aRequestItem } from '@ValenceRequests/testing/aRequestItem';
import { aSentDownload } from '@ValenceRequests/testing/aSentDownload';
import { createDatabaseFiledOrigins } from '@ValenceRequests/origins/createDatabaseFiledOrigins';

const RADARR = '5d0f7c1e-2b3a-4c5d-8e9f-0a1b2c3d4e5f';

describe('createDatabaseFiledOrigins', () => {
  it('says which client fetched a filed film, and which files in a filed album folder it filed', async () => {
    const db = await aScratchDatabase();
    const download = aSentDownload();

    await createDatabaseDownloadClientStore(db).insert(aDownloadClient());
    await createDatabaseSentDownloadStore(db).insert(download);
    await createDatabaseMediaRequestStore(db).insert(aMediaRequest());
    await createDatabaseRequestItemStore(db).insert(
      aRequestItem({ downloadId: download.id, filePath: '/media/films/Dune/Dune.mkv' }),
    );

    const filed = createDatabaseFiledOrigins(db);

    expect(await filed(['/media/films/Dune/Dune.mkv', '/media/films/Heat/Heat.mkv'])).toEqual({
      '/media/films/Dune/Dune.mkv': { source: 'download', via: 'qBittorrent' },
    });
    expect(await filed([])).toEqual({});
  });

  it('says which app a handed-off request was fetched by, for the files in its folder', async () => {
    const db = await aScratchDatabase();

    await db.insert(arrApp).values({
      id: RADARR,
      name: 'Radarr',
      kind: 'radarr',
      url: 'http://radarr:7878',
    });
    await createDatabaseMediaRequestStore(db).insert(
      aMediaRequest({
        handOff: {
          appId: RADARR,
          rootFolderPath: '/movies',
          qualityProfileId: 1,
          metadataProfileId: null,
          searchesOnAdd: true,
        },
      }),
    );
    await createDatabaseRequestItemStore(db).insert(
      aRequestItem({ filePath: '/media/books/Dune' }),
    );

    expect(await createDatabaseFiledOrigins(db)(['/media/books/Dune/Dune.epub'])).toEqual({
      '/media/books/Dune/Dune.epub': { source: 'handOff', via: 'Radarr' },
    });
  });
});

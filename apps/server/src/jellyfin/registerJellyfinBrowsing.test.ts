import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { seasonJellyfinId } from './seasonJellyfinId';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinServer } from './testing/aJellyfinServer';

const ItemsSchema = z.object({
  Items: z.array(z.object({ Id: z.string(), Name: z.string(), Type: z.string() }).passthrough()),
  TotalRecordCount: z.number(),
});

describe('registerJellyfinBrowsing', () => {
  it('list the viewer’s libraries as views', async () => {
    const { ask } = aJellyfinServer();
    const views = ItemsSchema.parse(await (await ask('/UserViews')).json());

    expect(views.Items.map((one) => [one.Name, one['CollectionType']])).toEqual([
      ['Films', 'movies'],
      ['Shows', 'tvshows'],
    ]);
  });

  it('list films and programmes the way an app pages through a library', async () => {
    const { ask, film, show } = aJellyfinServer();
    const films = ItemsSchema.parse(
      await (
        await ask(`/Items?ParentId=${film.libraryId.replaceAll('-', '')}&IncludeItemTypes=Movie`)
      ).json(),
    );
    const series = ItemsSchema.parse(
      await (
        await ask(
          `/users/x/items?parentId=${show.libraryId.replaceAll('-', '')}&includeItemTypes=Series&recursive=true`,
        )
      ).json(),
    );

    expect(films.Items.map((one) => one.Name)).toEqual(['Sneakers']);
    expect(series.Items.map((one) => [one.Type, one.Id])).toEqual([
      ['Series', showJellyfinId(show.libraryId, show.id)],
    ]);
  });

  it('page, sort and search what it lists', async () => {
    const { ask } = aJellyfinServer();
    const everything = ItemsSchema.parse(
      await (
        await ask(
          '/Items?Recursive=true&IncludeItemTypes=Movie,Episode&SortBy=SortName&Limit=1&StartIndex=1',
        )
      ).json(),
    );
    const found = ItemsSchema.parse(
      await (await ask('/Items?searchTerm=peaks&recursive=true')).json(),
    );

    expect(everything.TotalRecordCount).toBe(3);
    expect(everything.Items).toHaveLength(1);
    expect(found.Items.map((one) => one.Name)).toEqual(['Twin Peaks']);
  });

  it('list a programme’s seasons and a season’s episodes', async () => {
    const { ask, show } = aJellyfinServer();

    await ask('/Items?IncludeItemTypes=Series&Recursive=true');

    const seriesId = showJellyfinId(show.libraryId, show.id);
    const seasons = ItemsSchema.parse(await (await ask(`/Shows/${seriesId}/Seasons`)).json());
    const seasonTwo = seasonJellyfinId(`${show.libraryId}:${show.id}`, 2);
    const episodes = ItemsSchema.parse(
      await (await ask(`/Shows/${seriesId}/Episodes?SeasonId=${seasonTwo}`)).json(),
    );
    const underSeason = ItemsSchema.parse(await (await ask(`/Items?ParentId=${seasonTwo}`)).json());

    expect(seasons.Items.map((one) => one.Name)).toEqual(['Season 1', 'Season 2']);
    expect(episodes.Items.map((one) => one.Name)).toEqual(['May the Giant Be with You']);
    expect(underSeason.TotalRecordCount).toBe(1);
  });

  it('describe one item with the ways it can be played', async () => {
    const { ask, film } = aJellyfinServer();
    const item = await (await ask(`/Users/x/Items/${film.id.replaceAll('-', '')}`)).json();

    expect(item).toMatchObject({ Name: 'Sneakers', MediaSources: [{ Container: 'mkv' }] });
    expect((await ask(`/Items/${'f'.repeat(32)}`)).status).toBe(404);
  });

  it('list what is new, what somebody is part way through, and what is next', async () => {
    const { ask, post, film } = aJellyfinServer();

    await post('/Sessions/Playing/Progress', {
      ItemId: film.id.replaceAll('-', ''),
      PositionTicks: 600_000_000,
    });

    const latest = z
      .array(z.object({ Name: z.string() }))
      .parse(await (await ask('/Items/Latest')).json());
    const resume = ItemsSchema.parse(await (await ask('/UserItems/Resume')).json());
    const nextUp = ItemsSchema.parse(await (await ask('/Shows/NextUp')).json());

    expect(latest.map((one) => one.Name).sort()).toEqual(['Sneakers', 'Twin Peaks']);
    expect(resume.Items.map((one) => one.Name)).toEqual(['Sneakers']);
    expect(nextUp.Items.map((one) => one.Name)).toEqual(['May the Giant Be with You']);
  });
});

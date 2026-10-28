import { describe, expect, it } from 'vitest';
import { favouritesFirst } from './favouritesFirst';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';

const aChannel = (name: string, isFavourite: boolean) =>
  aLiveChannel({ id: `00000000-0000-4000-8000-${name.padStart(12, '0')}`, name, isFavourite });

describe('favouritesFirst', () => {
  it('puts the kept channels first, keeping the playlist order within each group', () => {
    const ordered = favouritesFirst([
      aChannel('1', false),
      aChannel('2', true),
      aChannel('3', false),
      aChannel('4', true),
    ]);

    expect(ordered.map((channel) => channel.name)).toStrictEqual(['2', '4', '1', '3']);
  });

  it('leaves a list with no favourites as it was', () => {
    expect(
      favouritesFirst([aChannel('1', false), aChannel('2', false)]).map((one) => one.name),
    ).toStrictEqual(['1', '2']);
  });
});

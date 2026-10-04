import { describe, expect, it } from 'vitest';
import { DiscordLookSchema } from '@ValenceContracts/schemas/DiscordPresence';
import { whatIsPlaying } from './whatIsPlaying';

const LOOK = DiscordLookSchema.parse({});

const SAID = {
  kind: 'watching',
  title: 'A Film',
  series: null,
  season: null,
  episode: null,
  startedAt: 1_755_000_000_000,
  endsAt: null,
  tmdbId: '550',
  isSeries: false,
  isPaused: false,
  artwork: null,
  party: null,
  look: LOOK,
};

describe('whatIsPlaying', () => {
  it('reads what a page said is playing', () => {
    expect(whatIsPlaying(SAID)).toEqual(SAID);
  });

  it('reads nothing as nothing, which is how a status clears', () => {
    expect(whatIsPlaying(null)).toBeNull();
  });

  it('refuses a title longer than a title, which would be published under somebody name', () => {
    expect(whatIsPlaying({ ...SAID, title: 'x'.repeat(500) })).toBeNull();
  });

  it('refuses an id that is not one, since it is put straight into a link', () => {
    expect(whatIsPlaying({ ...SAID, tmdbId: 'javascript:alert(1)' })).toBeNull();
  });

  it('refuses a shape it does not recognise rather than passing it on', () => {
    expect(whatIsPlaying({ title: 'A Film' })).toBeNull();
    expect(whatIsPlaying('a string')).toBeNull();
  });

  it('reads an episode, which carries the series and the numbers', () => {
    const episode = { ...SAID, series: 'A Programme', season: 2, episode: 12, isSeries: true };

    expect(whatIsPlaying(episode)).toMatchObject({ series: 'A Programme', season: 2 });
  });

  it('reads somebody browsing, which is a state of its own and not an absence', () => {
    expect(whatIsPlaying({ kind: 'browsing', look: LOOK })).toEqual({
      kind: 'browsing',
      look: LOOK,
    });
  });

  it('reads what a page from before the settings said, drawing it the way it always was', () => {
    const { look: _left, ...older } = SAID;

    expect(whatIsPlaying(older)).toEqual(SAID);
    expect(whatIsPlaying({ kind: 'browsing' })).toEqual({ kind: 'browsing', look: LOOK });
  });

  it('reads how the profile asked the status to look', () => {
    const look = { ...LOOK, statusShows: 'title', logo: 'dark', time: 'elapsed' };

    expect(whatIsPlaying({ ...SAID, look })).toEqual({ ...SAID, look });
  });

  it('falls back to the usual look rather than dropping the status over a look it cannot read', () => {
    expect(whatIsPlaying({ ...SAID, look: { logo: 'sepia' } })).toEqual(SAID);
  });

  it('refuses a state it does not know, rather than publishing it', () => {
    expect(whatIsPlaying({ kind: 'something-else' })).toBeNull();
  });

  it('keeps what is playing when the picture is one it cannot use, rather than saying nothing', () => {
    const read = whatIsPlaying({ ...SAID, artwork: 'not-a-url' });

    expect(read).not.toBeNull();
    expect(read?.kind === 'watching' ? read.artwork : 'x').toBeNull();
  });

  it('reads a watch party, which is what draws the group beside the time', () => {
    const read = whatIsPlaying({ ...SAID, party: { id: 'a-party', size: 3 } });

    expect(read?.kind === 'watching' ? read.party : null).toEqual({ id: 'a-party', size: 3 });
  });

  it('reads a track, which carries who made it rather than a series', () => {
    const track = {
      kind: 'listening',
      title: 'How Not To Drown',
      artists: ['CHVRCHES', 'Robert Smith'],
      startedAt: 1_755_000_000_000,
      endsAt: 1_755_000_331_000,
      isPaused: false,
      artwork: null,
      party: null,
      look: LOOK,
    };

    expect(whatIsPlaying(track)).toEqual(track);
  });

  it('refuses more names on a track than anybody would list', () => {
    const track = {
      kind: 'listening',
      title: 'How Not To Drown',
      artists: Array.from({ length: 21 }, (_, at) => `Artist ${at.toString()}`),
      startedAt: 1_755_000_000_000,
      endsAt: null,
      isPaused: false,
      artwork: null,
      party: null,
    };

    expect(whatIsPlaying(track)).toBeNull();
  });
});

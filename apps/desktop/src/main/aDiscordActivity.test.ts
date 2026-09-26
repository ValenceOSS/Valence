import { describe, expect, it } from 'vitest';
import { aDiscordActivity } from './aDiscordActivity';
import type { WhatIsPlaying } from './aDiscordActivity';

const STARTED = 1_755_000_000_000;

const OPENED = 1_754_990_000_000;

const AN_EPISODE: WhatIsPlaying = {
  kind: 'watching',
  title: 'The One With The Thing',
  series: 'A Programme',
  season: 2,
  episode: 12,
  startedAt: STARTED,
  endsAt: STARTED + 1_400_000,
  tmdbId: '1399',
  isSeries: true,
  isPaused: false,
  artwork: null,
  party: null,
};

const A_FILM: WhatIsPlaying = {
  kind: 'watching',
  title: 'A Film',
  series: null,
  season: null,
  episode: null,
  startedAt: STARTED,
  endsAt: null,
  tmdbId: '550',
  isSeries: false,
  isPaused: false,
  artwork: null,
  party: null,
};

const A_TRACK: WhatIsPlaying = {
  kind: 'listening',
  title: 'How Not To Drown',
  artists: ['CHVRCHES', 'Robert Smith'],
  startedAt: STARTED,
  endsAt: STARTED + 331_000,
  isPaused: false,
  artwork: null,
  party: null,
};

describe('aDiscordActivity', () => {
  it('puts the programme on the top line, which is the one Discord draws largest', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)).toMatchObject({
      details: 'A Programme',
    });
  });

  it('puts the episode below it, the way somebody would say it', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)).toMatchObject({
      state: 'Series 2, Episode 12',
    });
  });

  it('gives a film one line, since it belongs to no programme', () => {
    const activity = aDiscordActivity(A_FILM, OPENED);

    expect(activity).toMatchObject({ details: 'A Film' });
    expect(activity).not.toHaveProperty('state');
  });

  it('says it is watching rather than playing, which is a different word in Discord', () => {
    expect(aDiscordActivity(A_FILM, OPENED)).toMatchObject({ type: 3 });
  });

  it('sends the times in seconds, so Discord counts for itself rather than being told', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)?.timestamps).toEqual({
      start: 1_755_000_000,
      end: 1_755_001_400,
    });
  });

  it('sends no end for something whose length is not known', () => {
    expect(aDiscordActivity(A_FILM, OPENED)?.timestamps).toEqual({
      start: 1_755_000_000,
    });
  });

  it('draws the Valence logo where the catalogue has no picture to draw', () => {
    expect(aDiscordActivity(A_FILM, OPENED)?.assets).toMatchObject({
      large_image: 'valence-desktop',
      large_text: 'Valence',
    });
  });

  it('wears no badge while watching, since the logo already says which application this is', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)?.assets).not.toHaveProperty('small_image');
    expect(aDiscordActivity(AN_EPISODE, OPENED)?.assets).not.toHaveProperty('small_text');
  });

  it('wears no badge while browsing either', () => {
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)?.assets).not.toHaveProperty(
      'small_image',
    );
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)?.assets).not.toHaveProperty('small_text');
  });

  it('offers a way to look a film up, pointed at the right kind of page', () => {
    expect(aDiscordActivity(A_FILM, OPENED)?.buttons).toEqual([
      { label: 'View on TMDB', url: 'https://www.themoviedb.org/movie/550' },
    ]);
  });

  it('points a programme at the programme page rather than the film one', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)?.buttons?.[0]?.url).toBe(
      'https://www.themoviedb.org/tv/1399',
    );
  });

  it('offers no button for something the catalogue never matched', () => {
    expect(
      aDiscordActivity({ ...A_FILM, kind: 'watching', tmdbId: null }, OPENED),
    ).not.toHaveProperty('buttons');
  });

  it('says nothing at all when nothing is playing, which is how presence clears', () => {
    expect(aDiscordActivity(null, OPENED)).toBeNull();
  });

  it('says somebody has Valence open when they are between things, rather than nothing at all', () => {
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)?.details).toBe('Browsing libraries');
  });

  it('draws the logo while browsing, so the status looks like the one beside it', () => {
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)?.assets).toMatchObject({
      large_image: 'valence-desktop',
      large_text: 'Valence',
    });
  });

  it('counts from when Valence opened while browsing, however often it is said again', () => {
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)?.timestamps).toEqual({
      start: OPENED / 1000,
    });
  });

  it('offers no button while browsing, since there is nowhere in particular to send anybody', () => {
    expect(aDiscordActivity({ kind: 'browsing' }, OPENED)).not.toHaveProperty('buttons');
  });

  it('draws the catalogue picture where there is one, which is what somebody recognises', () => {
    const poster = 'https://image.tmdb.org/t/p/w500/abc.jpg';

    expect(aDiscordActivity({ ...AN_EPISODE, artwork: poster }, OPENED)?.assets).toMatchObject({
      large_image: poster,
    });
  });

  it('refuses a picture from anywhere else, which would publish where somebody keeps their server', () => {
    const mine = 'https://valence.mine.local/api/media/1/poster';

    expect(aDiscordActivity({ ...AN_EPISODE, artwork: mine }, OPENED)?.assets).toMatchObject({
      large_image: 'valence-desktop',
    });
  });

  it('refuses a picture sent without encryption, wherever it came from', () => {
    const plain = 'http://image.tmdb.org/t/p/w500/abc.jpg';

    expect(aDiscordActivity({ ...AN_EPISODE, artwork: plain }, OPENED)?.assets).toMatchObject({
      large_image: 'valence-desktop',
    });
  });

  it('says which application this is when somebody rests on the picture, not which version', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)?.assets.large_text).toBe('Valence');
  });

  it('sends a watch party as a group, so it draws the figure and the count', () => {
    expect(
      aDiscordActivity({ ...AN_EPISODE, party: { id: 'a-party', size: 3 } }, OPENED)?.party,
    ).toEqual({
      id: 'a-party',
      size: [3, 3],
    });
  });

  it('sends no group for somebody watching on their own', () => {
    expect(aDiscordActivity(AN_EPISODE, OPENED)).not.toHaveProperty('party');
  });

  it('marks a pause rather than taking the status down, since a pause is still watching', () => {
    expect(aDiscordActivity({ ...AN_EPISODE, isPaused: true }, OPENED)?.state).toBe(
      'Paused — Series 2, Episode 12',
    );
  });

  it('says so plainly for a film, which has no line of its own to add it to', () => {
    expect(aDiscordActivity({ ...A_FILM, isPaused: true }, OPENED)?.state).toBe('Paused');
  });

  it('takes the clock off while paused, which would otherwise count towards an end not coming', () => {
    expect(aDiscordActivity({ ...AN_EPISODE, isPaused: true }, OPENED)).not.toHaveProperty(
      'timestamps',
    );
  });

  it('keeps what is playing on the status while paused, so it is still recognisable', () => {
    expect(aDiscordActivity({ ...AN_EPISODE, isPaused: true }, OPENED)?.details).toBe(
      'A Programme',
    );
  });

  it('says who somebody is watching with, in the line they read rather than a field they will not see', () => {
    expect(
      aDiscordActivity({ ...AN_EPISODE, party: { id: 'a-party', size: 2 } }, OPENED)?.state,
    ).toBe('Series 2, Episode 12 · with 1 other');
  });

  it('counts the others rather than the party, since somebody knows they are in it', () => {
    expect(
      aDiscordActivity({ ...AN_EPISODE, party: { id: 'a-party', size: 4 } }, OPENED)?.state,
    ).toBe('Series 2, Episode 12 · with 3 others');
  });

  it('says the company for a film, which has no line of its own to add it to', () => {
    expect(aDiscordActivity({ ...A_FILM, party: { id: 'a-party', size: 3 } }, OPENED)?.state).toBe(
      'with 2 others',
    );
  });

  it('says nothing about company for a party of one, which is watching alone', () => {
    expect(
      aDiscordActivity({ ...AN_EPISODE, party: { id: 'a-party', size: 1 } }, OPENED)?.state,
    ).toBe('Series 2, Episode 12');
  });

  it('keeps both the pause and the company, which are true at the same time', () => {
    expect(
      aDiscordActivity({ ...AN_EPISODE, isPaused: true, party: { id: 'a-party', size: 2 } }, OPENED)
        ?.state,
    ).toBe('Paused — Series 2, Episode 12 · with 1 other');
  });

  it('says it is listening rather than watching, which is a different word in Discord', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)).toMatchObject({ type: 2 });
  });

  it('puts the track on the top line', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)).toMatchObject({
      details: 'How Not To Drown',
    });
  });

  it('wears a badge over its own cover, since the cover no longer says which application this is', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)?.assets).toMatchObject({
      small_image: 'valence-desktop',
      small_text: 'Playing',
    });
  });

  it('badges a pause, so a still status is not mistaken for a stuck one', () => {
    expect(aDiscordActivity({ ...A_TRACK, isPaused: true }, OPENED)?.assets).toMatchObject({
      small_text: 'Paused',
    });
  });

  it('names who made it below the track, the way somebody would say it aloud', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)?.state).toBe('CHVRCHES & Robert Smith');
  });

  it('names who made it in the header too, rather than saying which application this is', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)?.name).toBe('CHVRCHES & Robert Smith');
  });

  it('joins three or more names the way somebody would say them aloud', () => {
    expect(aDiscordActivity({ ...A_TRACK, artists: ['A', 'B', 'C'] }, OPENED)?.state).toBe(
      'A, B & C',
    );
  });

  it('draws the catalogue cover for a track, from the server actually holding it', () => {
    const cover = 'https://valence.mine.local/api/music/albums/an-album/artwork';

    expect(aDiscordActivity({ ...A_TRACK, artwork: cover }, OPENED)?.assets).toMatchObject({
      large_image: cover,
    });
  });

  it('refuses a track cover sent without encryption, wherever it came from', () => {
    const plain = 'http://valence.mine.local/api/music/albums/an-album/artwork';

    expect(aDiscordActivity({ ...A_TRACK, artwork: plain }, OPENED)?.assets).toMatchObject({
      large_image: 'valence-desktop',
    });
  });

  it('sends the times in seconds, so Discord counts down the track for itself', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)?.timestamps).toEqual({
      start: 1_755_000_000,
      end: 1_755_000_331,
    });
  });

  it('takes the clock off while paused, which would otherwise count towards an end not coming', () => {
    expect(aDiscordActivity({ ...A_TRACK, isPaused: true }, OPENED)).not.toHaveProperty(
      'timestamps',
    );
  });

  it('marks a pause rather than taking the status down, since a pause is still listening', () => {
    expect(aDiscordActivity({ ...A_TRACK, isPaused: true }, OPENED)?.state).toBe(
      'Paused — CHVRCHES & Robert Smith',
    );
  });

  it('offers no button, since there is nowhere in particular to send anybody for a track', () => {
    expect(aDiscordActivity(A_TRACK, OPENED)).not.toHaveProperty('buttons');
  });

  it('sends a listening party as a group, exactly as a watch party is sent', () => {
    expect(
      aDiscordActivity({ ...A_TRACK, party: { id: 'a-party', size: 3 } }, OPENED)?.party,
    ).toEqual({
      id: 'a-party',
      size: [3, 3],
    });
  });

  it('says who else is listening in the line somebody reads', () => {
    expect(aDiscordActivity({ ...A_TRACK, party: { id: 'a-party', size: 2 } }, OPENED)?.state).toBe(
      'CHVRCHES & Robert Smith · with 1 other',
    );
  });
});

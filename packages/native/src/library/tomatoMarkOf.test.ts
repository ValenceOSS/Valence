import fresh from '@ValenceRatings/rotten-tomatoes-fresh.png';
import rotten from '@ValenceRatings/rotten-tomatoes-rotten.png';
import { tomatoMarkOf } from './tomatoMarkOf';

describe('tomatoMarkOf', () => {
  it('gives the fresh tomato from 60% up', () => {
    expect(tomatoMarkOf(60)).toEqual({ picture: fresh, label: 'Fresh on Rotten Tomatoes' });
    expect(tomatoMarkOf(94)).toEqual({ picture: fresh, label: 'Fresh on Rotten Tomatoes' });
  });

  it('gives the green splat below 60%', () => {
    expect(tomatoMarkOf(59)).toEqual({ picture: rotten, label: 'Rotten on Rotten Tomatoes' });
  });

  it('tells the two apart', () => {
    expect(fresh).not.toBe(rotten);
  });
});

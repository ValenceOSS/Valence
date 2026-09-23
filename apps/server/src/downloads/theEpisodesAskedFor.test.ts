import { describe, expect, it } from 'vitest';
import { theEpisodesAskedFor } from './theEpisodesAskedFor';

const EPISODES = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];

describe('theEpisodesAskedFor', () => {
  it('takes every episode where nobody narrowed it', () => {
    expect(theEpisodesAskedFor(EPISODES, undefined)).toEqual(EPISODES);
  });

  it('takes only the ones asked for, in the programme’s own order', () => {
    expect(theEpisodesAskedFor(EPISODES, ['three', 'one'])).toEqual([
      { id: 'one' },
      { id: 'three' },
    ]);
  });

  it('drops an id that is not one of the programme’s episodes', () => {
    expect(theEpisodesAskedFor(EPISODES, ['two', 'somebody-elses-film'])).toEqual([{ id: 'two' }]);
  });

  it('takes nothing where nothing was asked for', () => {
    expect(theEpisodesAskedFor(EPISODES, [])).toEqual([]);
  });
});

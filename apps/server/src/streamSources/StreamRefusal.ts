import { SaidError } from '@ValenceI18n/SaidError';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

class StreamRefusal extends SaidError {
  readonly problem: PlaybackProblem;

  /**
   * Says why a streamed film could not be played, in words and as the problem a player shows.
   *
   * @param said - Why, in words.
   * @param problem - The problem a player shows for it.
   */
  constructor(said: Said, problem: PlaybackProblem) {
    super(said);
    this.name = 'StreamRefusal';
    this.problem = problem;
  }
}

export { StreamRefusal };

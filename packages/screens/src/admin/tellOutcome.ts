import { notify } from '@ValenceUI/notify';

/**
 * Tells the administrator how an action went, in a toast: what was done where it worked, and what
 * went wrong where it did not.
 *
 * Every action in the admin area ends this way, so that pressing something is always answered — an
 * action that succeeds silently looks the same as one that did nothing, and one that fails silently
 * looks the same as one that worked.
 *
 * @param done - What was done, said in the past tense, for when it worked.
 * @param failure - Why it did not work, or nothing where it did.
 * @returns Whether it worked, so the caller can go on to reload what it changed.
 */
const tellOutcome = (done: string, failure: string | null): boolean => {
  if (failure === null) {
    notify.worked(done);

    return true;
  }

  notify.failed(failure);

  return false;
};

export { tellOutcome };

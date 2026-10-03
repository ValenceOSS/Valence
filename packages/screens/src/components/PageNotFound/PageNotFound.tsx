import { Compass as CompassIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { ProblemCard } from '@ValenceScreens/components/ProblemCard/ProblemCard';
import { say } from '@ValenceI18n/say';

/**
 * Where an address leads nowhere Valence knows, said the way any other page that could not be shown
 * is said, with a way back to where somebody came from and a way to the start.
 */
const PageNotFound = () => (
  <ProblemCard
    icon={CompassIcon}
    headline={say('screens.pageProblem.describeProblem.thisPageCouldNotBeFound')}
    reason={say('screens.pageProblem.describeProblem.itMayHaveBeenMovedOr')}
    actions={
      <>
        <Button
          variant="glossy"
          onClick={() => {
            window.history.back();
          }}
        >
          {say('common.goBack')}
        </Button>

        <Button
          variant="confirm"
          onClick={() => {
            window.location.assign('/');
          }}
        >
          {say('screens.pageProblem.goToTheStart')}
        </Button>
      </>
    }
  />
);

PageNotFound.displayName = 'PageNotFound';

export { PageNotFound };

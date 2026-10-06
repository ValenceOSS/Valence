import { Button } from '@ValenceUI/Button';
import { PageHero } from '@ValenceUI/PageHero';

/**
 * What is shown where a page has failed, instead of the whole site going white: the opening card
 * saying so, with a way to try again.
 */
const PageProblem = () => (
  <div role="alert">
    <PageHero
      eyebrow="Something went wrong"
      lead="This page stopped working"
      description="Something on this page went wrong. Try it again."
      actions={
        <Button
          variant="confirm"
          size="lg"
          onClick={() => {
            window.location.reload();
          }}
        >
          Try again
        </Button>
      }
    />
  </div>
);

PageProblem.displayName = 'PageProblem';

export { PageProblem };

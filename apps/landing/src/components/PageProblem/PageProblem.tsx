import { Button } from '@ValenceUI/Button';

/**
 * What is shown where a page has failed, instead of the whole site going white.
 */
const PageProblem = () => (
  <main
    role="alert"
    className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-3 px-5 py-16 sm:px-10"
  >
    <h1 className="text-2xl font-semibold text-text">This page stopped working</h1>

    <p className="text-text-muted">Something on this page went wrong. Try it again.</p>

    <Button
      variant="secondary"
      onClick={() => {
        window.location.reload();
      }}
    >
      Try again
    </Button>
  </main>
);

PageProblem.displayName = 'PageProblem';

export { PageProblem };

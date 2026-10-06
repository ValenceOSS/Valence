import { useNavigate } from '@tanstack/react-router';
import { Button } from '@ValenceUI/Button';
import { PageHero } from '@ValenceUI/PageHero';

/**
 * What an address that is not a page shows: the opening card saying where it landed, and the way
 * back to the start.
 */
const DocsNotFound = () => {
  const navigate = useNavigate();

  return (
    <PageHero
      eyebrow="Not found"
      lead="That page is not here"
      description="It may have moved, or the address may be mistyped. Search for it above, or start from the beginning."
      actions={
        <Button
          variant="confirm"
          size="lg"
          onClick={() => {
            void navigate({ to: '/' });
          }}
        >
          Back to the documentation home
        </Button>
      }
    />
  );
};

DocsNotFound.displayName = 'DocsNotFound';

export { DocsNotFound };

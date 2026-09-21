import { Link } from '@tanstack/react-router';

/**
 * What an address that is not a page shows: where it landed and the way back to the start.
 */
const DocsNotFound = () => (
  <div className="flex flex-col items-start gap-4 px-6 py-24 lg:px-12">
    <h1 className="text-3xl font-bold tracking-tight text-text">That page is not here</h1>

    <p className="max-w-xl text-text-muted">
      It may have moved, or the address may be mistyped. Search for it above, or start from the
      beginning.
    </p>

    <Link to="/" className="font-medium text-accent underline-offset-4 hover:underline">
      Back to the documentation home
    </Link>
  </div>
);

DocsNotFound.displayName = 'DocsNotFound';

export { DocsNotFound };
